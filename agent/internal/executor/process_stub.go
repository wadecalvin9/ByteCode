//go:build !windows && !linux
package executor

import "fmt"

func listProcessesInternal() (string, error) {
	return "", fmt.Errorf("process listing not supported on this platform")
}

func listProcessesJSONInternal() (string, error) {
	return "[]", nil
}
