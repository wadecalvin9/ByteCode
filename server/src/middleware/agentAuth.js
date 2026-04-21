const { db } = require('../config/db');

/**
 * Middleware: Verify agent API key
 * Agents send their api_key in the X-Agent-Key header
 */
function verifyAgentKey(req, res, next) {
  const apiKey = req.headers['x-agent-key'];

  if (!apiKey) {
    return res.status(401).json({ error: 'No agent key provided.' });
  }

  const agent = db.prepare('SELECT id, status FROM agents WHERE api_key = ?').get(apiKey);

  if (!agent) {
    return res.status(403).json({ error: 'Invalid agent key.' });
  }

  if (agent.status === 'killed') {
    return res.status(403).json({ error: 'Agent has been terminated.' });
  }

  req.agentId = agent.id;
  next();
}

module.exports = { verifyAgentKey };
