//go:build !windows
// +build !windows

package windows

import "fmt"

func ImpersonateProcess(pid uint32) (string, error) {
	return "", fmt.Errorf("Token impersonation is only supported on Windows")
}

func RevertToSelf() (string, error) {
	return "", fmt.Errorf("Token impersonation is only supported on Windows")
}
