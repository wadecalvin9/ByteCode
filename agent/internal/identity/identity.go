package identity

import (
	"encoding/json"
	"fmt"
	"net"
	"os"
	"runtime"
)

// Identity holds the agent's persistent identity
type Identity struct {
	AgentID  string `json:"agent_id"`
	APIKey   string `json:"api_key"`
	Hostname string `json:"hostname"`
	OS       string `json:"os"`
	Arch     string `json:"arch"`
}

// SystemInfo collects current system information
type SystemInfo struct {
	Hostname   string `json:"hostname"`
	OS         string `json:"os"`
	Arch       string `json:"arch"`
	PID        int    `json:"pid"`
	InternalIP string `json:"internal_ip"`
}

// GetSystemInfo collects system metadata
func GetSystemInfo() *SystemInfo {
	hostname, _ := os.Hostname()
	return &SystemInfo{
		Hostname:   hostname,
		OS:         runtime.GOOS,
		Arch:       runtime.GOARCH,
		PID:        os.Getpid(),
		InternalIP: getInternalIP(),
	}
}

// Load reads identity from disk if it exists
func Load(filepath string) (*Identity, error) {
	data, err := os.ReadFile(filepath)
	if err != nil {
		return nil, err
	}

	var id Identity
	if err := json.Unmarshal(data, &id); err != nil {
		return nil, err
	}

	return &id, nil
}

// Save writes identity to disk
func Save(filepath string, id *Identity) error {
	data, err := json.MarshalIndent(id, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(filepath, data, 0600)
}

// getInternalIP returns the primary internal IP address
func getInternalIP() string {
	addrs, err := net.InterfaceAddrs()
	if err != nil {
		return "unknown"
	}

	for _, addr := range addrs {
		if ipnet, ok := addr.(*net.IPNet); ok && !ipnet.IP.IsLoopback() {
			if ipnet.IP.To4() != nil {
				return ipnet.IP.String()
			}
		}
	}

	return "unknown"
}

// String returns a formatted identity string
func (id *Identity) String() string {
	return fmt.Sprintf("Agent[%s] host=%s os=%s/%s", id.AgentID[:8], id.Hostname, id.OS, id.Arch)
}
