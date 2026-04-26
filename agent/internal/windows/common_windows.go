//go:build windows
// +build windows

package windows

import (
	"os/exec"
	"syscall"
)

var (
	Kernel32 = syscall.NewLazyDLL("kernel32.dll")
	Ntdll    = syscall.NewLazyDLL("ntdll.dll")
	Advapi32 = syscall.NewLazyDLL("advapi32.dll")

	// Shared Procedures
	ProcOpenProcess  = Kernel32.NewProc("OpenProcess")
	ProcCloseHandle  = Kernel32.NewProc("CloseHandle")
)

// HideConsole prevents a console window from popping up when running a command
func HideConsole(cmd *exec.Cmd) {
	if cmd.SysProcAttr == nil {
		cmd.SysProcAttr = &syscall.SysProcAttr{}
	}
	cmd.SysProcAttr.HideWindow = true
}

const (
	// Memory Protections
	PAGE_NOACCESS          = 0x01
	PAGE_READONLY          = 0x02
	PAGE_READWRITE         = 0x04
	PAGE_WRITECOPY         = 0x08
	PAGE_EXECUTE           = 0x10
	PAGE_EXECUTE_READ      = 0x20
	PAGE_EXECUTE_READWRITE = 0x40
	
	// Memory States
	MEM_COMMIT  = 0x1000
	MEM_RESERVE = 0x2000
	
	// Process Access
	PROCESS_ALL_ACCESS = 0x1F0FFF
)
