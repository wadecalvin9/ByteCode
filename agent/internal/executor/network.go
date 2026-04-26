package executor

import (
	"encoding/json"
	"fmt"
	"net"
	"os/exec"
	"runtime"
	"strconv"
	"strings"
	"sync"
	"time"

	"bytecode-agent/internal/windows"
)

// getNetworkInfo returns network interface and connection info
func getNetworkInfo(_ interface{}) (string, error) {
	var sb strings.Builder

	// Network interfaces
	ifaces, err := net.Interfaces()
	if err == nil {
		sb.WriteString("=== NETWORK INTERFACES ===\n\n")
		for _, iface := range ifaces {
			addrs, _ := iface.Addrs()
			addrStrs := make([]string, 0)
			for _, addr := range addrs {
				addrStrs = append(addrStrs, addr.String())
			}
			sb.WriteString(fmt.Sprintf("%-20s MAC=%-20s Flags=%-12s Addrs=%s\n",
				iface.Name, iface.HardwareAddr.String(), iface.Flags.String(),
				strings.Join(addrStrs, ", ")))
		}
	}

	// Connections via netstat
	sb.WriteString("\n=== ACTIVE CONNECTIONS ===\n\n")
	var cmd *exec.Cmd
	if runtime.GOOS == "windows" {
		cmd = exec.Command("netstat", "-ano")
		windows.HideConsole(cmd)
	} else {
		cmd = exec.Command("netstat", "-tulpn")
	}
	out, err := cmd.CombinedOutput()
	if err == nil {
		sb.WriteString(string(out))
	} else {
		sb.WriteString(fmt.Sprintf("netstat failed: %v\n", err))
	}

	// ARP table
	sb.WriteString("\n=== ARP TABLE ===\n\n")
	arpCmd := exec.Command("arp", "-a")
	windows.HideConsole(arpCmd)
	arpOut, err := arpCmd.CombinedOutput()
	if err == nil {
		sb.WriteString(string(arpOut))
	}

	return sb.String(), nil
}

// portScan scans TCP ports on a target
func portScan(payload interface{}) (string, error) {
	payloadMap, ok := toMap(payload)
	if !ok {
		return "", fmt.Errorf("invalid payload")
	}

	target, _ := payloadMap["target"].(string)
	if target == "" {
		return "", fmt.Errorf("missing 'target'")
	}

	portsStr, _ := payloadMap["ports"].(string)
	if portsStr == "" {
		portsStr = "21,22,23,25,53,80,110,135,139,143,443,445,993,995,1433,1723,3306,3389,5432,5900,8080,8443"
	}

	ports := parsePorts(portsStr)
	if len(ports) == 0 {
		return "", fmt.Errorf("no valid ports specified")
	}
	if len(ports) > 1024 {
		return "", fmt.Errorf("too many ports (max 1024)")
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("Scanning %s (%d ports)...\n\n", target, len(ports)))

	type scanResult struct {
		port int
		open bool
	}

	results := make(chan scanResult, len(ports))
	var wg sync.WaitGroup

	// Limit concurrency to 50
	sem := make(chan struct{}, 50)

	for _, port := range ports {
		wg.Add(1)
		go func(p int) {
			defer wg.Done()
			sem <- struct{}{}
			defer func() { <-sem }()

			addr := net.JoinHostPort(target, strconv.Itoa(p))
			conn, err := net.DialTimeout("tcp", addr, 2*time.Second)
			if err == nil {
				conn.Close()
				results <- scanResult{port: p, open: true}
			}
		}(port)
	}

	go func() {
		wg.Wait()
		close(results)
	}()

	openPorts := make([]int, 0)
	for r := range results {
		if r.open {
			openPorts = append(openPorts, r.port)
		}
	}

	if len(openPorts) == 0 {
		sb.WriteString("No open ports found.\n")
	} else {
		sb.WriteString(fmt.Sprintf("%-8s %-10s %s\n", "PORT", "STATE", "SERVICE"))
		sb.WriteString(fmt.Sprintf("%-8s %-10s %s\n", "----", "-----", "-------"))
		for _, p := range openPorts {
			sb.WriteString(fmt.Sprintf("%-8d %-10s %s\n", p, "OPEN", guessService(p)))
		}
		sb.WriteString(fmt.Sprintf("\n%d open ports found", len(openPorts)))
	}

	return sb.String(), nil
}

func parsePorts(s string) []int {
	ports := make([]int, 0)
	parts := strings.Split(s, ",")
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if strings.Contains(part, "-") {
			rangeParts := strings.SplitN(part, "-", 2)
			start, end := 0, 0
			fmt.Sscanf(rangeParts[0], "%d", &start)
			fmt.Sscanf(rangeParts[1], "%d", &end)
			if start > 0 && end >= start && end <= 65535 {
				for p := start; p <= end; p++ {
					ports = append(ports, p)
				}
			}
		} else {
			p := 0
			fmt.Sscanf(part, "%d", &p)
			if p > 0 && p <= 65535 {
				ports = append(ports, p)
			}
		}
	}
	return ports
}

func guessService(port int) string {
	services := map[int]string{
		21: "FTP", 22: "SSH", 23: "Telnet", 25: "SMTP",
		53: "DNS", 80: "HTTP", 110: "POP3", 135: "RPC",
		139: "NetBIOS", 143: "IMAP", 443: "HTTPS", 445: "SMB",
		993: "IMAPS", 995: "POP3S", 1433: "MSSQL", 1723: "PPTP",
		3306: "MySQL", 3389: "RDP", 5432: "PostgreSQL",
		5900: "VNC", 8080: "HTTP-Proxy", 8443: "HTTPS-Alt",
	}
	if s, ok := services[port]; ok {
		return s
	}
	return "unknown"
}

// ConnectionInfo represents a network connection
type ConnectionInfo struct {
	Proto  string `json:"proto"`
	Local  string `json:"local"`
	Remote string `json:"remote"`
	State  string `json:"state"`
	PID    string `json:"pid"`
}

// getNetworkInfoJSON returns network info as structured JSON
func getNetworkInfoJSON(_ interface{}) (string, error) {
	var connections []ConnectionInfo

	if runtime.GOOS == "windows" {
		// Parse netstat -ano
		cmd := exec.Command("netstat", "-ano")
		windows.HideConsole(cmd)
		out, err := cmd.Output()
		if err == nil {
			lines := strings.Split(string(out), "\n")
			for _, line := range lines {
				fields := strings.Fields(line)
				if len(fields) >= 4 && (fields[0] == "TCP" || fields[0] == "UDP") {
					conn := ConnectionInfo{
						Proto: fields[0],
						Local: fields[1],
						State: "UNKNOWN",
					}
					if fields[0] == "TCP" {
						conn.Remote = fields[2]
						conn.State = fields[3]
						if len(fields) >= 5 {
							conn.PID = fields[4]
						}
					} else {
						conn.Remote = fields[2]
						if len(fields) >= 4 {
							conn.PID = fields[3]
						}
					}
					connections = append(connections, conn)
				}
			}
		}
	} else {
		// Linux - Parse ss -ntu
		out, err := exec.Command("ss", "-ntu", "-H").Output()
		if err == nil {
			lines := strings.Split(string(out), "\n")
			for _, line := range lines {
				fields := strings.Fields(line)
				if len(fields) >= 5 {
					connections = append(connections, ConnectionInfo{
						Proto:  "TCP", // ss -t is TCP
						Local:  fields[3],
						Remote: fields[4],
						State:  fields[0],
					})
				}
			}
		}
	}

	jsonBytes, _ := json.MarshalIndent(connections, "", "  ")
	return string(jsonBytes), nil
}
