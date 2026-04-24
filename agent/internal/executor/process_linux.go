//go:build linux
package executor

import (
	"encoding/json"
	"fmt"
	"os"
	"strconv"
	"strings"
)

func listProcessesInternal() (string, error) {
	entries, err := os.ReadDir("/proc")
	if err != nil {
		return "", fmt.Errorf("failed to read /proc: %w", err)
	}

	var processes []ProcessInfo
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		pid, err := strconv.Atoi(entry.Name())
		if err != nil {
			continue
		}

		comm, err := os.ReadFile(fmt.Sprintf("/proc/%d/comm", pid))
		if err != nil {
			continue
		}

		ppid := 0
		stat, err := os.ReadFile(fmt.Sprintf("/proc/%d/stat", pid))
		if err == nil {
			fields := strings.Fields(string(stat))
			if len(fields) > 3 {
				ppid, _ = strconv.Atoi(fields[3])
			}
		}

		processes = append(processes, ProcessInfo{
			PID:  pid,
			PPID: ppid,
			Name: strings.TrimSpace(string(comm)),
		})
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("%-8s %-8s %s\n", "PID", "PPID", "NAME"))
	sb.WriteString(fmt.Sprintf("%-8s %-8s %s\n", "---", "----", "----"))
	for _, p := range processes {
		sb.WriteString(fmt.Sprintf("%-8d %-8d %s\n", p.PID, p.PPID, p.Name))
	}
	sb.WriteString(fmt.Sprintf("\nTotal processes: %d", len(processes)))
	return sb.String(), nil
}

func listProcessesJSONInternal() (string, error) {
	entries, err := os.ReadDir("/proc")
	if err != nil {
		return "", fmt.Errorf("failed to read /proc: %w", err)
	}

	var processes []ProcessInfo
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		pid, err := strconv.Atoi(entry.Name())
		if err != nil {
			continue
		}
		comm, err := os.ReadFile(fmt.Sprintf("/proc/%d/comm", pid))
		if err != nil {
			continue
		}
		ppid := 0
		stat, err := os.ReadFile(fmt.Sprintf("/proc/%d/stat", pid))
		if err == nil {
			fields := strings.Fields(string(stat))
			if len(fields) > 3 {
				ppid, _ = strconv.Atoi(fields[3])
			}
		}
		processes = append(processes, ProcessInfo{
			PID:  pid,
			PPID: ppid,
			Name: strings.TrimSpace(string(comm)),
		})
	}

	jsonBytes, _ := json.MarshalIndent(processes, "", "  ")
	return string(jsonBytes), nil
}
