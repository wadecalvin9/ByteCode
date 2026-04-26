//go:build !windows
package main

func ShowMessage(title, text string) {
	// No-op for non-Windows platforms
}

func HideConsoleWindow() {
	// No-op for non-Windows platforms
}
