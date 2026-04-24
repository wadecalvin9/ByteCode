package executor

import (
	"fmt"
)

// BOFContext holds the state of a running BOF, including its output buffer
type BOFContext struct {
	Output []byte
}

// BeaconPrintf is the standard BOF function for sending text back to the server
func (ctx *BOFContext) BeaconPrintf(format string, args ...interface{}) {
	msg := fmt.Sprintf(format, args...)
	ctx.Output = append(ctx.Output, []byte(msg)...)
}

// BeaconOutput is the standard BOF function for sending raw data back
func (ctx *BOFContext) BeaconOutput(data []byte) {
	ctx.Output = append(ctx.Output, data...)
}

// HandleBOFResults processes the final output from a BOF execution
func (ctx *BOFContext) GetResults() string {
	if len(ctx.Output) == 0 {
		return "[+] BOF executed successfully (no output)"
	}
	return string(ctx.Output)
}
