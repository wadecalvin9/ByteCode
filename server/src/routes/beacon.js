const express = require('express');
const router = express.Router();
const { verifyAgentKey } = require('../middleware/agentAuth');
const Agent = require('../models/agent');
const Task = require('../models/task');

/**
 * POST /api/beacon
 * Agent heartbeat - updates last_seen, returns next task if available
 * Auth: Agent API key
 */
router.post('/', verifyAgentKey, (req, res) => {
  try {
    const agentId = req.agentId;

    // Update last seen
    Agent.updateLastSeen(agentId);

    // Check for pending task
    const task = Task.getNextForAgent(agentId);

    if (task) {
      console.log(`[BEACON] Agent ${agentId.slice(0, 8)}... -> Task: ${task.type} (${task.id.slice(0, 8)}...)`);
      
      // Parse payload if it's a string
      let payload = task.payload;
      try {
        payload = JSON.parse(task.payload);
      } catch (e) {
        // payload is already parsed or not JSON
      }

      return res.json({
        task: {
          id: task.id,
          type: task.type,
          payload: payload
        }
      });
    }

    // No task
    res.json({ task: null });
  } catch (err) {
    console.error('[BEACON] Error:', err.message);
    res.status(500).json({ error: 'Beacon processing failed' });
  }
});

module.exports = router;
