package comms

import (
	"encoding/json"
	"fmt"
	"log"
	"net/url"
	"time"


	"github.com/gorilla/websocket"
)

// WSMessage represents a message received over WebSocket
type WSMessage struct {
	Type    string       `json:"type"`
	Payload *TaskPayload `json:"payload"`
}

// WSClient handles the WebSocket connection to the server
type WSClient struct {
	ServerURL string
	AgentID   string
	APIKey    string
	Conn      *websocket.Conn
	TaskChan  chan *TaskPayload
}

// NewWSClient creates a new WebSocket client
func NewWSClient(serverURL, agentID, apiKey string) *WSClient {
	return &WSClient{
		ServerURL: serverURL,
		AgentID:   agentID,
		APIKey:    apiKey,
		TaskChan:  make(chan *TaskPayload, 10),
	}
}

// Connect establishes the WebSocket connection
func (w *WSClient) Connect() error {
	u, err := url.Parse(w.ServerURL)
	if err != nil {
		return err
	}

	scheme := "ws"
	if u.Scheme == "https" {
		scheme = "wss"
	}

	wsURL := url.URL{
		Scheme:   scheme,
		Host:     u.Host,
		Path:     "/ws/agent",
		RawQuery: fmt.Sprintf("id=%s&key=%s", w.AgentID, w.APIKey),
	}

	log.Printf("[WS] Connecting to %s\n", wsURL.String())

	conn, _, err := websocket.DefaultDialer.Dial(wsURL.String(), nil)
	if err != nil {
		return err
	}

	w.Conn = conn
	go w.readLoop()
	return nil
}

func (w *WSClient) readLoop() {
	defer func() {
		if w.Conn != nil {
			w.Conn.Close()
			w.Conn = nil
		}
		log.Println("[WS] Connection closed")
	}()


	for {
		_, message, err := w.Conn.ReadMessage()
		if err != nil {
			log.Printf("[WS] Read error: %v\n", err)
			return
		}

		var msg WSMessage
		if err := json.Unmarshal(message, &msg); err != nil {
			log.Printf("[WS] Failed to unmarshal message: %v\n", err)
			continue
		}

		switch msg.Type {
		case "ping":
			// Just a keep-alive
		case "task":
			if msg.Payload != nil {
				log.Printf("[WS] Received task: %s\n", msg.Payload.ID[:8])
				w.TaskChan <- msg.Payload
			}
		default:
			log.Printf("[WS] Unknown message type: %s\n", msg.Type)
		}
	}
}

// Reconnect attempts to reconnect to the server with backoff
func (w *WSClient) Reconnect() {
	backoff := 5 * time.Second
	for {
		err := w.Connect()
		if err == nil {
			log.Println("[WS] Reconnected successfully")
			return
		}
		log.Printf("[WS] Reconnect failed: %v. Retrying in %v...\n", err, backoff)
		time.Sleep(backoff)
		
		// Cap backoff at 1 minute
		if backoff < 1*time.Minute {
			backoff *= 2
		}
	}
}
