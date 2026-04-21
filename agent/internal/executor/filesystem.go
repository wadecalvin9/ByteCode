package executor

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// listDirectory lists contents of a directory
func listDirectory(payload interface{}) (string, error) {
	payloadMap, ok := toMap(payload)
	path := "."
	if ok {
		if p, ok := payloadMap["path"].(string); ok && p != "" {
			path = p
		}
	}

	absPath, err := filepath.Abs(path)
	if err != nil {
		return "", fmt.Errorf("failed to resolve path: %w", err)
	}

	entries, err := os.ReadDir(absPath)
	if err != nil {
		return "", fmt.Errorf("failed to list directory: %w", err)
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("Directory: %s\n\n", absPath))
	sb.WriteString(fmt.Sprintf("%-12s %-12s %-20s %s\n", "MODE", "SIZE", "MODIFIED", "NAME"))
	sb.WriteString(fmt.Sprintf("%-12s %-12s %-20s %s\n", "----", "----", "--------", "----"))

	for _, entry := range entries {
		info, err := entry.Info()
		if err != nil {
			continue
		}
		mode := info.Mode().String()
		size := info.Size()
		modTime := info.ModTime().Format("2006-01-02 15:04")
		name := entry.Name()
		sizeStr := formatBytes(size)
		if entry.IsDir() {
			name = name + "/"
			sizeStr = "<DIR>"
		}
		sb.WriteString(fmt.Sprintf("%-12s %-12s %-20s %s\n", mode, sizeStr, modTime, name))
	}
	sb.WriteString(fmt.Sprintf("\n%d items", len(entries)))
	return sb.String(), nil
}

// changeDirectory changes the working directory
func changeDirectory(payload interface{}) (string, error) {
	payloadMap, ok := toMap(payload)
	if !ok {
		return "", fmt.Errorf("invalid payload: expected object with 'path' field")
	}
	path, ok := payloadMap["path"].(string)
	if !ok || path == "" {
		return "", fmt.Errorf("missing 'path' in payload")
	}
	if err := os.Chdir(path); err != nil {
		return "", fmt.Errorf("failed to change directory: %w", err)
	}
	cwd, _ := os.Getwd()
	return fmt.Sprintf("Changed directory to: %s", cwd), nil
}

// printWorkingDirectory returns current working directory
func printWorkingDirectory() (string, error) {
	cwd, err := os.Getwd()
	if err != nil {
		return "", fmt.Errorf("failed to get working directory: %w", err)
	}
	return cwd, nil
}

// writeFileToDisk writes data to a file
func writeFileToDisk(payload interface{}) (string, error) {
	payloadMap, ok := toMap(payload)
	if !ok {
		return "", fmt.Errorf("invalid payload")
	}
	path, _ := payloadMap["path"].(string)
	if path == "" {
		return "", fmt.Errorf("missing 'path'")
	}
	content, _ := payloadMap["content"].(string)
	isB64, _ := payloadMap["base64"].(bool)

	var data []byte
	if isB64 {
		var err error
		data, err = base64.StdEncoding.DecodeString(content)
		if err != nil {
			return "", fmt.Errorf("base64 decode failed: %w", err)
		}
	} else {
		data = []byte(content)
	}
	if err := os.WriteFile(path, data, 0644); err != nil {
		return "", fmt.Errorf("failed to write: %w", err)
	}
	return fmt.Sprintf("Written %d bytes to %s", len(data), path), nil
}

// deleteFileFromDisk removes a file or directory
func deleteFileFromDisk(payload interface{}) (string, error) {
	payloadMap, ok := toMap(payload)
	if !ok {
		return "", fmt.Errorf("invalid payload")
	}
	path, _ := payloadMap["path"].(string)
	if path == "" {
		return "", fmt.Errorf("missing 'path'")
	}
	info, err := os.Stat(path)
	if err != nil {
		return "", fmt.Errorf("not found: %w", err)
	}
	if info.IsDir() {
		if err := os.RemoveAll(path); err != nil {
			return "", fmt.Errorf("failed: %w", err)
		}
		return fmt.Sprintf("Removed directory: %s", path), nil
	}
	if err := os.Remove(path); err != nil {
		return "", fmt.Errorf("failed: %w", err)
	}
	return fmt.Sprintf("Deleted: %s", path), nil
}

// makeDirectory creates a directory tree
func makeDirectory(payload interface{}) (string, error) {
	payloadMap, ok := toMap(payload)
	if !ok {
		return "", fmt.Errorf("invalid payload")
	}
	path, _ := payloadMap["path"].(string)
	if path == "" {
		return "", fmt.Errorf("missing 'path'")
	}
	if err := os.MkdirAll(path, 0755); err != nil {
		return "", fmt.Errorf("failed: %w", err)
	}
	return fmt.Sprintf("Created directory: %s", path), nil
}

// copyFile copies a file from src to dst
func copyFile(payload interface{}) (string, error) {
	payloadMap, ok := toMap(payload)
	if !ok {
		return "", fmt.Errorf("invalid payload")
	}

	src, _ := payloadMap["src"].(string)
	dst, _ := payloadMap["dst"].(string)
	if src == "" || dst == "" {
		return "", fmt.Errorf("missing 'src' or 'dst' in payload")
	}

	data, err := os.ReadFile(src)
	if err != nil {
		return "", fmt.Errorf("failed to read source: %w", err)
	}

	if err := os.WriteFile(dst, data, 0644); err != nil {
		return "", fmt.Errorf("failed to write destination: %w", err)
	}

	return fmt.Sprintf("Copied %s -> %s (%d bytes)", src, dst, len(data)), nil
}

// moveFile moves/renames a file
func moveFile(payload interface{}) (string, error) {
	payloadMap, ok := toMap(payload)
	if !ok {
		return "", fmt.Errorf("invalid payload")
	}

	src, _ := payloadMap["src"].(string)
	dst, _ := payloadMap["dst"].(string)
	if src == "" || dst == "" {
		return "", fmt.Errorf("missing 'src' or 'dst' in payload")
	}

	if err := os.Rename(src, dst); err != nil {
		return "", fmt.Errorf("failed to move: %w", err)
	}

	return fmt.Sprintf("Moved %s -> %s", src, dst), nil
}

func formatBytes(b int64) string {
	const unit = 1024
	if b < unit {
		return fmt.Sprintf("%d B", b)
	}
	div, exp := int64(unit), 0
	for n := b / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB", float64(b)/float64(div), "KMG"[exp])
}

// FileInfo represents a file on disk for JSON output
type FileInfo struct {
	Name    string `json:"name"`
	Size    int64  `json:"size"`
	IsDir   bool   `json:"is_dir"`
	Mode    string `json:"mode"`
	ModTime string `json:"mod_time"`
}

// listDirectoryJSON returns directory contents as JSON
func listDirectoryJSON(payload interface{}) (string, error) {
	payloadMap, ok := toMap(payload)
	path := "."
	if ok {
		if p, ok := payloadMap["path"].(string); ok && p != "" {
			path = p
		}
	}

	absPath, err := filepath.Abs(path)
	if err != nil {
		return "", fmt.Errorf("failed to resolve path: %w", err)
	}

	entries, err := os.ReadDir(absPath)
	if err != nil {
		return "", fmt.Errorf("failed to list: %w", err)
	}

	var files []FileInfo
	for _, entry := range entries {
		info, err := entry.Info()
		if err != nil {
			continue
		}
		files = append(files, FileInfo{
			Name:    entry.Name(),
			Size:    info.Size(),
			IsDir:   entry.IsDir(),
			Mode:    info.Mode().String(),
			ModTime: info.ModTime().Format("2006-01-02 15:04"),
		})
	}

	// Prepare final response with path context
	response := map[string]interface{}{
		"path":  absPath,
		"files": files,
	}

	jsonBytes, _ := json.MarshalIndent(response, "", "  ")
	return string(jsonBytes), nil
}
