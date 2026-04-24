//go:build windows
package windows

import (
	"fmt"
	"unsafe"
)

// DoSyscall is defined in syscalls_amd64.s
func DoSyscall(ssn uint32, args ...uintptr) uint32

// GetSyscallID finds the SSN (System Service Number) for a given Nt function
func GetSyscallID(functionName string) (uint32, error) {
	proc := Ntdll.NewProc(functionName)
	if proc.Addr() == 0 {
		return 0, fmt.Errorf("function %s not found in ntdll", functionName)
	}

	// Read the first 32 bytes of the function
	ptr := proc.Addr()
	
	// We look for the pattern:
	// mov r10, rcx
	// mov eax, <SSN>
	// 4C 8B D1 B8 <SSN>
	
	data := (*[32]byte)(unsafe.Pointer(ptr))
	
	for i := 0; i < 20; i++ {
		// Look for 'mov eax, SSN' opcode (0xB8)
		if data[i] == 0xB8 {
			ssnPtr := unsafe.Add(unsafe.Pointer(ptr), i+1)
			ssn := *(*uint32)(ssnPtr)
			return ssn, nil
		}
		
		// If we hit a 'ret' (0xC3) or 'jmp' (0xE9) before finding the SSN,
		// it might be hooked! (Halo's Gate could handle this)
		if data[i] == 0xC3 || data[i] == 0xE9 {
			break
		}
	}

	return 0, fmt.Errorf("could not find SSN for %s (possibly hooked)", functionName)
}

// IndirectSyscall is a high-level wrapper to execute an NT function stealthily
func IndirectSyscall(name string, args ...uintptr) (uint32, error) {
	ssn, err := GetSyscallID(name)
	if err != nil {
		return 0, err
	}
	
	// Execute the syscall via the assembly stub
	return DoSyscall(ssn, args...), nil
}
