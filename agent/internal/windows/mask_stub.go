//go:build !windows
package windows

// MaskMemory is a no-op on non-Windows platforms for now
func MaskMemory(data []byte, key byte) error {
	return nil
}

// MaskAgentMemory is a no-op stub
func MaskAgentMemory(active bool, key byte) {
}
