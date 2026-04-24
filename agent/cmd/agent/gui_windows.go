//go:build windows
package main

import (
	"syscall"
	"unsafe"
)

func ShowMessage(title, text string) {
	user32 := syscall.NewLazyDLL("user32.dll")
	messageBox := user32.NewProc("MessageBoxW")
	messageBox.Call(0,
		uintptr(unsafe.Pointer(syscall.StringToUTF16Ptr(text))),
		uintptr(unsafe.Pointer(syscall.StringToUTF16Ptr(title))),
		0)
}
