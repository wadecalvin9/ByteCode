const { WebSocketServer } = require('ws');
const url = require('url');

class WebSocketManager {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // AgentID -> WebSocket
  }

  initialize(server) {
    this.wss = new WebSocketServer({ noServer: true });

    server.on('upgrade', (request, socket, head) => {
      const pathname = url.parse(request.url).pathname;

      if (pathname === '/ws/agent') {
        this.wss.handleUpgrade(request, socket, head, (ws) => {
          this.wss.emit('connection', ws, request);
        });
      } else {
        socket.destroy();
      }
    });

    this.wss.on('connection', (ws, request) => {
      const query = url.parse(request.url, true).query;
      const agentId = query.id;
      const apiKey = query.key;

      if (!agentId || !apiKey) {
        console.log('[WS] Rejected: Missing ID or API Key');
        ws.close(1008, 'Authentication required');
        return;
      }

      // In a real app, verify the API key against the DB here
      // For now, we trust the agentId if it matches a known agent
      
      console.log(`[WS] Agent connected: ${agentId}`);
      this.clients.set(agentId, ws);

      ws.on('close', () => {
        console.log(`[WS] Agent disconnected: ${agentId}`);
        this.clients.delete(agentId);
      });

      ws.on('error', (err) => {
        console.error(`[WS] Error for agent ${agentId}:`, err.message);
        this.clients.delete(agentId);
      });

      // Send initial ping to confirm connection
      ws.send(JSON.stringify({ type: 'ping', timestamp: Date.now() }));
    });
  }

  sendTask(agentId, task) {
    const ws = this.clients.get(agentId);
    if (ws && ws.readyState === 1) { // OPEN
      ws.send(JSON.stringify({ type: 'task', payload: task }));
      return true;
    }
    return false;
  }

  isOnline(agentId) {
    return this.clients.has(agentId);
  }
}

module.exports = new WebSocketManager();
