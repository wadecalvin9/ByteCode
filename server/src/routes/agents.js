const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Agent = require('../models/agent');
const Result = require('../models/result');

/**
 * GET /api/agents
 * List all agents with status info
 * Auth: JWT (operator)
 */
router.get('/', verifyToken, (req, res) => {
  try {
    const agents = Agent.getAll();
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

    res.json({ agent, results });
  } catch (err) {
    console.error('[AGENTS] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch agent' });
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
