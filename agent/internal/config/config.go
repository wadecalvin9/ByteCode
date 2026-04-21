package config

import (
	"os"
)

// DefaultServerURL can be overridden at build time using:
// -ldflags="-X 'bytecode/internal/config.DefaultServerURL=http://your-ip:3001'"
var DefaultServerURL = "http://localhost:3001"

// Config holds the agent configuration
type Config struct {
	ServerURL     string
	BeaconMin     int // Minimum beacon interval in seconds
	BeaconMax     int // Maximum beacon interval in seconds (jitter)
	IdentityFile  string
}

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

	return &Config{
		ServerURL:    serverURL,
		BeaconMin:    10,
		BeaconMax:    30,
		IdentityFile: identityFile,
	}
}
