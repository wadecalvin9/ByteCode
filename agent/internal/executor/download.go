package executor

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

// downloadFromUrl downloads a file from a URL to the local disk
func downloadFromUrl(payload interface{}, apiKey string, taskID string) (string, error) {
	payloadMap, ok := toMap(payload)
	if !ok {
		return "", fmt.Errorf("invalid payload")
	}

	url, _ := payloadMap["url"].(string)
	path, _ := payloadMap["path"].(string)

	if url == "" || path == "" {
		return "", fmt.Errorf("missing 'url' or 'path' in payload")
	}

	// Replace placeholder with actual task ID
	url = strings.ReplaceAll(url, "__TASK_ID__", taskID)

	client := &http.Client{
		Timeout: 5 * time.Minute,
	}

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("X-Agent-Key", apiKey)

	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("HTTP GET failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("server returned status %d", resp.StatusCode)
	}

	out, err := os.Create(path)
	if err != nil {
		return "", fmt.Errorf("failed to create file: %w", err)
	}
	defer out.Close()

	n, err := io.Copy(out, resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to save file: %w", err)
	}

	return fmt.Sprintf("Successfully downloaded %s to %s (%d bytes)", url, path, n), nil
}

// uploadToUrl uploads a local file to a remote URL (POST)
func uploadToUrl(payload interface{}, apiKey string, taskID string) (string, error) {
	payloadMap, ok := toMap(payload)
	if !ok {
		return "", fmt.Errorf("invalid payload")
	}

	url, _ := payloadMap["url"].(string)
	path, _ := payloadMap["path"].(string)

	if url == "" || path == "" {
		return "", fmt.Errorf("missing 'url' or 'path' in payload")
	}

	// Replace placeholder with actual task ID
	url = strings.ReplaceAll(url, "__TASK_ID__", taskID)

	file, err := os.Open(path)
	if err != nil {
		return "", fmt.Errorf("failed to open file: %w", err)
	}
	defer file.Close()

	client := &http.Client{
		Timeout: 5 * time.Minute,
	}

	req, err := http.NewRequest("POST", url, file)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %w", err)
	}
	req.Header.Set("Content-Type", "application/octet-stream")
	req.Header.Set("X-Agent-Key", apiKey)

	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("HTTP POST failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 400 {
		return "", fmt.Errorf("server returned error status %d", resp.StatusCode)
	}

	return fmt.Sprintf("Successfully uploaded %s to %s", path, url), nil
}
