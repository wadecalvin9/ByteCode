//go:build !windows
package executor

import "fmt"

func handleInjection(_ interface{}) (string, error) {
	return "", fmt.Errorf("process injection is only supported on Windows")
}
