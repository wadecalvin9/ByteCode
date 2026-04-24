//go:build !windows
// +build !windows

package windows

func GetCurrentPrivileges() (string, error) {
	return "[!] Privilege auditing is only supported on Windows.", nil
}
