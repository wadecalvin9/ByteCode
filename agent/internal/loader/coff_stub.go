//go:build !windows
// +build !windows

package loader

import "fmt"

// RunBOF is a stub for non-Windows platforms
func RunBOF(data []byte, entryName string) (string, error) {
	return "", fmt.Errorf("BOF execution is only supported on Windows targets")
}
