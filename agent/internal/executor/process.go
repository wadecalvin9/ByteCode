package executor

import (
	"fmt"
	"os"
)

// ProcessInfo represents a running process
type ProcessInfo struct {
	PID     int    `json:"pid"`
	PPID    int    `json:"ppid"`
	Name    string `json:"name"`
	Threads int    `json:"threads"`
}

// listProcesses enumerates running processes
func listProcesses() (string, error) {
	return listProcessesInternal()
}

// killProcess kills a process by PID
func killProcess(payload interface{}) (string, error) {
	payloadMap, ok := toMap(payload)
	if !ok {
		return "", fmt.Errorf("invalid payload: expected object with 'pid' field")
	}

	pidFloat, ok := payloadMap["pid"].(float64)
	if !ok {
		return "", fmt.Errorf("missing or invalid 'pid' in payload")
	}
	pid := int(pidFloat)

	proc, err := os.FindProcess(pid)
	if err != nil {
		return "", fmt.Errorf("process %d not found: %w", pid, err)
	}

	if err := proc.Kill(); err != nil {
		return "", fmt.Errorf("failed to kill process %d: %w", pid, err)
	}

	return fmt.Sprintf("Process %d terminated successfully", pid), nil
}

// listProcessesJSON returns process list as JSON (for dashboard rendering)
func listProcessesJSON() (string, error) {
	return listProcessesJSONInternal()
}
