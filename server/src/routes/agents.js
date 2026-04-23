const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Agent = require('../models/agent');
const Result = require('../models/result');

console.log('[AGENTS] Router initialized');

router.use((req, res, next) => {
  console.log(`[AGENTS] Request received: ${req.method} ${req.url}`);
  next();
});

const wsManager = require('../utils/wsManager');

/**
 * GET /api/agents
 * List all agents with status info
 * Auth: JWT (operator)
 */
router.get('/', verifyToken, (req, res) => {
  try {
    const agents = Agent.getAll().map(agent => ({
      ...agent,
      is_online_ws: wsManager.isOnline(agent.id)
    }));
    const stats = Agent.getStats();

    res.json({ agents, stats });
  } catch (err) {
    console.error('[AGENTS] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch agents' });
  }
});

/**
 * GET /api/agents/stats
 * Get agent statistics
 * Auth: JWT (operator)
 */
router.get('/stats', verifyToken, (req, res) => {
  try {
    const stats = Agent.getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * GET /api/agents/:id
 * Get details for a specific agent
 * Auth: JWT (operator)
 */
router.get('/:id', verifyToken, (req, res) => {
  try {
    const agent = Agent.getById(req.params.id);

    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const results = Result.getByAgent(req.params.id);
    
    // Add WS status
    agent.is_online_ws = wsManager.isOnline(agent.id);

    res.json({ agent, results });
  } catch (err) {
    console.error('[AGENTS] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch agent' });
  }
});


/**
 * PATCH /api/agents/:id/metadata
 * Update agent metadata (notes, tags, etc)
 * Auth: JWT (operator)
 */
router.patch('/:id/metadata', verifyToken, (req, res) => {
  try {
    const { metadata } = req.body;
    Agent.updateMetadata(req.params.id, metadata);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update metadata' });
  }
});

/**
 * POST /api/agents/purge/:id
 * Permanently remove an agent from database
 * Auth: JWT (operator)
 */
router.post('/purge/:id', verifyToken, (req, res) => {
  console.log(`[AGENTS] Attempting purge for ID: ${req.params.id}`);
  try {
    Agent.remove(req.params.id);
    console.log(`[AGENTS] Agent ${req.params.id.slice(0, 8)}... PURGED`);
    res.json({ ok: true });
  } catch (err) {
    console.error('[AGENTS] Purge Error:', err.message);
    res.status(500).json({ error: 'Failed to purge agent' });
  }
});

/**
 * DELETE /api/agents/:id
 * Kill (deactivate) an agent
 * Auth: JWT (operator)
 */
router.delete('/:id', verifyToken, (req, res) => {
  try {
    Agent.kill(req.params.id);
    console.log(`[AGENTS] Agent ${req.params.id.slice(0, 8)}... killed`);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to kill agent' });
  }
});

module.exports = router;
