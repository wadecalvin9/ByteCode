//go:build windows
package executor

import (
	"encoding/json"
	"fmt"
	"strings"
	"syscall"
	"unsafe"
)

func listProcessesInternal() (string, error) {
	kernel32 := syscall.NewLazyDLL("kernel32.dll")
	createSnapshot := kernel32.NewProc("CreateToolhelp32Snapshot")
	process32First := kernel32.NewProc("Process32FirstW")
	process32Next := kernel32.NewProc("Process32NextW")
	closeHandle := kernel32.NewProc("CloseHandle")

	// TH32CS_SNAPPROCESS = 0x00000002
	handle, _, err := createSnapshot.Call(0x00000002, 0)
	if handle == 0 {
		return "", fmt.Errorf("CreateToolhelp32Snapshot failed: %v", err)
	}
	defer closeHandle.Call(handle)

	type PROCESSENTRY32W struct {
		Size              uint32
		Usage             uint32
		ProcessID         uint32
		DefaultHeapID     uintptr
		ModuleID          uint32
		Threads           uint32
		ParentProcessID   uint32
		PriClassBase      int32
		Flags             uint32
		ExeFile           [260]uint16
	}

	var entry PROCESSENTRY32W
	entry.Size = uint32(unsafe.Sizeof(entry))

	var processes []ProcessInfo

	ret, _, _ := process32First.Call(handle, uintptr(unsafe.Pointer(&entry)))
	if ret == 0 {
		return "", fmt.Errorf("Process32First failed")
	}

	for {
		name := syscall.UTF16ToString(entry.ExeFile[:])
		processes = append(processes, ProcessInfo{
			PID:     int(entry.ProcessID),
			PPID:    int(entry.ParentProcessID),
			Name:    name,
			Threads: int(entry.Threads),
		})

		ret, _, _ = process32Next.Call(handle, uintptr(unsafe.Pointer(&entry)))
		if ret == 0 {
			break
		}
	}

	// Format as table
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("%-8s %-8s %-8s %s\n", "PID", "PPID", "THREADS", "NAME"))
	sb.WriteString(fmt.Sprintf("%-8s %-8s %-8s %s\n", "---", "----", "-------", "----"))
	for _, p := range processes {
		sb.WriteString(fmt.Sprintf("%-8d %-8d %-8d %s\n", p.PID, p.PPID, p.Threads, p.Name))
	}
	sb.WriteString(fmt.Sprintf("\nTotal processes: %d", len(processes)))
	return sb.String(), nil
}

func listProcessesJSONInternal() (string, error) {
	kernel32 := syscall.NewLazyDLL("kernel32.dll")
	createSnapshot := kernel32.NewProc("CreateToolhelp32Snapshot")
	process32First := kernel32.NewProc("Process32FirstW")
	process32Next := kernel32.NewProc("Process32NextW")
	closeHandle := kernel32.NewProc("CloseHandle")

	handle, _, err := createSnapshot.Call(0x00000002, 0)
	if handle == 0 {
		return "", fmt.Errorf("CreateToolhelp32Snapshot failed: %v", err)
	}
	defer closeHandle.Call(handle)

	type PROCESSENTRY32W struct {
		Size              uint32
		Usage             uint32
		ProcessID         uint32
		DefaultHeapID     uintptr
		ModuleID          uint32
		Threads           uint32
		ParentProcessID   uint32
		PriClassBase      int32
		Flags             uint32
		ExeFile           [260]uint16
	}

	var entry PROCESSENTRY32W
	entry.Size = uint32(unsafe.Sizeof(entry))

	var processes []ProcessInfo
	ret, _, _ := process32First.Call(handle, uintptr(unsafe.Pointer(&entry)))
	if ret == 0 {
		return "", fmt.Errorf("Process32First failed")
	}

	for {
		name := syscall.UTF16ToString(entry.ExeFile[:])
		processes = append(processes, ProcessInfo{
			PID:     int(entry.ProcessID),
			PPID:    int(entry.ParentProcessID),
			Name:    name,
			Threads: int(entry.Threads),
		})
		ret, _, _ = process32Next.Call(handle, uintptr(unsafe.Pointer(&entry)))
		if ret == 0 {
			break
		}
	}

	jsonBytes, _ := json.MarshalIndent(processes, "", "  ")
	return string(jsonBytes), nil
}
