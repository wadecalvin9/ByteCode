package executor

import (
	"bytes"
	"encoding/base64"
	"fmt"
	"image"
	"image/color"
	"image/jpeg"
	"runtime"
	"syscall"
	"unsafe"
)

// BITMAPINFOHEADER for GetDIBits
type bitmapInfoHeader struct {
	BiSize          uint32
	BiWidth         int32
	BiHeight        int32
	BiPlanes        uint16
	BiBitCount      uint16
	BiCompression   uint32
	BiSizeImage     uint32
	BiXPelsPerMeter int32
	BiYPelsPerMeter int32
	BiClrUsed       uint32
	BiClrImportant  uint32
}

// captureScreenshot captures the screen and returns base64-encoded JPEG
func captureScreenshot() (string, error) {
	if runtime.GOOS != "windows" {
		return "", fmt.Errorf("screenshot not supported on %s", runtime.GOOS)
	}

	user32 := syscall.NewLazyDLL("user32.dll")
	gdi32 := syscall.NewLazyDLL("gdi32.dll")

	getDC := user32.NewProc("GetDC")
	releaseDC := user32.NewProc("ReleaseDC")
	getSystemMetrics := user32.NewProc("GetSystemMetrics")
	createCompatibleDC := gdi32.NewProc("CreateCompatibleDC")
	createCompatibleBitmap := gdi32.NewProc("CreateCompatibleBitmap")
	selectObject := gdi32.NewProc("SelectObject")
	bitBlt := gdi32.NewProc("BitBlt")
	deleteDC := gdi32.NewProc("DeleteDC")
	deleteObject := gdi32.NewProc("DeleteObject")
	getDIBits := gdi32.NewProc("GetDIBits")

	// Get screen dimensions
	w, _, _ := getSystemMetrics.Call(0) // SM_CXSCREEN
	h, _, _ := getSystemMetrics.Call(1) // SM_CYSCREEN
	width := int(w)
	height := int(h)

	// Get desktop DC
	hdc, _, _ := getDC.Call(0)
	if hdc == 0 {
		return "", fmt.Errorf("GetDC failed")
	}
	defer releaseDC.Call(0, hdc)

	// Create memory DC
	memDC, _, _ := createCompatibleDC.Call(hdc)
	if memDC == 0 {
		return "", fmt.Errorf("CreateCompatibleDC failed")
	}
	defer deleteDC.Call(memDC)

	// Create bitmap
	bitmap, _, _ := createCompatibleBitmap.Call(hdc, uintptr(width), uintptr(height))
	if bitmap == 0 {
		return "", fmt.Errorf("CreateCompatibleBitmap failed")
	}
	defer deleteObject.Call(bitmap)

	// Select bitmap into memory DC
	selectObject.Call(memDC, bitmap)

	// BitBlt: copy screen to memory DC (SRCCOPY = 0x00CC0020)
	bitBlt.Call(memDC, 0, 0, uintptr(width), uintptr(height), hdc, 0, 0, 0x00CC0020)

	// Prepare BITMAPINFOHEADER (negative height = top-down)
	header := bitmapInfoHeader{
		BiSize:        uint32(unsafe.Sizeof(bitmapInfoHeader{})),
		BiWidth:       int32(width),
		BiHeight:      -int32(height), // negative = top-down
		BiPlanes:      1,
		BiBitCount:    32,
		BiCompression: 0, // BI_RGB
	}

	// Allocate pixel buffer (BGRA, 4 bytes per pixel)
	dataSize := width * height * 4
	pixelData := make([]byte, dataSize)

	// Extract pixel data
	ret, _, _ := getDIBits.Call(
		memDC,
		bitmap,
		0,
		uintptr(height),
		uintptr(unsafe.Pointer(&pixelData[0])),
		uintptr(unsafe.Pointer(&header)),
		0, // DIB_RGB_COLORS
	)
	if ret == 0 {
		return "", fmt.Errorf("GetDIBits failed")
	}

	// Create Go image from BGRA pixel data
	img := image.NewRGBA(image.Rect(0, 0, width, height))
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			offset := (y*width + x) * 4
			b := pixelData[offset]
			g := pixelData[offset+1]
			r := pixelData[offset+2]
			img.SetRGBA(x, y, color.RGBA{R: r, G: g, B: b, A: 255})
		}
	}

	// Encode as JPEG (quality 50 for reasonable size)
	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: 50}); err != nil {
		return "", fmt.Errorf("JPEG encode failed: %w", err)
	}

	// Return as base64 with data URI prefix for easy dashboard rendering
	encoded := base64.StdEncoding.EncodeToString(buf.Bytes())
	return fmt.Sprintf("SCREENSHOT:data:image/jpeg;base64,%s", encoded), nil
}
