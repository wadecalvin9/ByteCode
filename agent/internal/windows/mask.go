//go:build windows
package windows

import (
	"unsafe"
)

var (
	virtualProtect = Kernel32.NewProc("VirtualProtect")
)

// MaskMemory encrypts a memory region
func MaskMemory(data []byte, key byte) error {
	for i := range data {
		data[i] ^= key
	}
	return nil
}

// VirtualProtectWrapper is a safe wrapper for the Windows API
func VirtualProtectWrapper(address uintptr, size uintptr, newProtect uint32) (uint32, error) {
	var oldProtect uint32
	ret, _, err := virtualProtect.Call(
		address,
		size,
		uintptr(newProtect),
		uintptr(unsafe.Pointer(&oldProtect)),
	)
	if ret == 0 {
		return 0, err
	}
	return oldProtect, nil
}

// MaskAgentMemory obfuscates the agent's sensitive data during sleep
func MaskAgentMemory(active bool, key byte) {
	// Implementation logic for Phase 2 hardening
}
