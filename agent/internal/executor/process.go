package executor

import (
	"encoding/json"
	"fmt"
	"os"
	"runtime"
	"strconv"
	"strings"
	"syscall"
	"unsafe"
)

// ProcessInfo represents a running process
type ProcessInfo struct {
	PID     int    `json:"pid"`
	PPID    int    `json:"ppid"`
	Name    string `json:"name"`
	Threads int    `json:"threads"`
}

// listProcesses enumerates running processes
func listProcesses() (string, error) {
	if runtime.GOOS == "windows" {
		return listProcessesWindows()
	}
	return listProcessesLinux()
}

func listProcessesWindows() (string, error) {
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

func listProcessesLinux() (string, error) {
	entries, err := os.ReadDir("/proc")
	if err != nil {
		return "", fmt.Errorf("failed to read /proc: %w", err)
	}

	var processes []ProcessInfo
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		pid, err := strconv.Atoi(entry.Name())
		if err != nil {
			continue
		}

		// Read process name from /proc/PID/comm
		comm, err := os.ReadFile(fmt.Sprintf("/proc/%d/comm", pid))
		if err != nil {
			continue
		}

		// Read PPID from /proc/PID/stat
		ppid := 0
		stat, err := os.ReadFile(fmt.Sprintf("/proc/%d/stat", pid))
		if err == nil {
			fields := strings.Fields(string(stat))
			if len(fields) > 3 {
				ppid, _ = strconv.Atoi(fields[3])
			}
		}

		processes = append(processes, ProcessInfo{
			PID:  pid,
			PPID: ppid,
			Name: strings.TrimSpace(string(comm)),
		})
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("%-8s %-8s %s\n", "PID", "PPID", "NAME"))
	sb.WriteString(fmt.Sprintf("%-8s %-8s %s\n", "---", "----", "----"))
	for _, p := range processes {
		sb.WriteString(fmt.Sprintf("%-8d %-8d %s\n", p.PID, p.PPID, p.Name))
	}
	sb.WriteString(fmt.Sprintf("\nTotal processes: %d", len(processes)))
	return sb.String(), nil
}

// killProcess kills a process by PID
func killProcess(payload interface{}) (string, error) {
	payloadMap, ok := toMap(payload)
	if !ok {
		return "", fmt.Errorf("invalid payload: expected object with 'pid' field")
	}

	pidFloat, ok := payloadMap["pid"].(float64)
	if !ok {
		return "", fmt.Errorf("missing or invalid 'pid' in payload")
	}
	pid := int(pidFloat)

	proc, err := os.FindProcess(pid)
	if err != nil {
		return "", fmt.Errorf("process %d not found: %w", pid, err)
	}

	if err := proc.Kill(); err != nil {
		return "", fmt.Errorf("failed to kill process %d: %w", pid, err)
	}

	return fmt.Sprintf("Process %d terminated successfully", pid), nil
}

// listProcessesJSON returns process list as JSON (for dashboard rendering)
func listProcessesJSON() (string, error) {
	if runtime.GOOS == "windows" {
		return listProcessesJSONWindows()
	}
	return listProcessesJSONLinux()
}

func listProcessesJSONWindows() (string, error) {
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

func listProcessesJSONLinux() (string, error) {
	entries, err := os.ReadDir("/proc")
	if err != nil {
		return "", fmt.Errorf("failed to read /proc: %w", err)
	}

	var processes []ProcessInfo
	for _, entry := range entries {
		if !entry.IsDir() {
			continue
		}
		pid, err := strconv.Atoi(entry.Name())
		if err != nil {
			continue
		}
		comm, err := os.ReadFile(fmt.Sprintf("/proc/%d/comm", pid))
		if err != nil {
			continue
		}
		ppid := 0
		stat, err := os.ReadFile(fmt.Sprintf("/proc/%d/stat", pid))
		if err == nil {
			fields := strings.Fields(string(stat))
			if len(fields) > 3 {
				ppid, _ = strconv.Atoi(fields[3])
			}
		}
		processes = append(processes, ProcessInfo{
			PID:  pid,
			PPID: ppid,
			Name: strings.TrimSpace(string(comm)),
		})
	}

	jsonBytes, _ := json.MarshalIndent(processes, "", "  ")
	return string(jsonBytes), nil
}
