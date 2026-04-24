//go:build !windows
package executor

import (
	"fmt"
	"runtime"
)

func captureScreenshot() (string, error) {
	return "", fmt.Errorf("screenshot not supported on %s", runtime.GOOS)
}
