//go:build !windows
package windows

import (
	"fmt"
	"os/exec"
)

func HideConsole(cmd *exec.Cmd) {
	// Do nothing on non-Windows platforms
}

func GetSyscallID(functionName string) (uint32, error) {
	return 0, fmt.Errorf("syscalls not supported on this platform")
}

func IndirectSyscall(name string, args ...uintptr) (uint32, error) {
	return 0, fmt.Errorf("syscalls not supported on this platform")
}
