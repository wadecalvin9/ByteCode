const express = require('express');
const router = express.Router();
const { verifyAgentKey } = require('../middleware/agentAuth');
const Result = require('../models/result');
const Task = require('../models/task');

/**
 * POST /api/result
 * Agent submits task execution result
 * Auth: Agent API key
 */
router.post('/', verifyAgentKey, (req, res) => {
  try {
    const agentId = req.agentId;
    const { task_id, output, error, status } = req.body;

    if (!task_id) {
      return res.status(400).json({ error: 'task_id is required' });
    }

    // Store the result
    const result = Result.create({
      task_id,
      agent_id: agentId,
      output: typeof output === 'string' ? output : JSON.stringify(output),
      error,
      status: status || (error ? 'error' : 'success')
    });

    // Update task status
    if (error || status === 'error') {
      Task.fail(task_id);
    } else {
      Task.complete(task_id);
    }

    console.log(`[RESULT] Agent ${agentId.slice(0, 8)}... -> Task ${task_id.slice(0, 8)}... : ${result.status}`);

    res.json({ ok: true, result_id: result.id });
  } catch (err) {
    console.error('[RESULT] Error:', err.message);
    res.status(500).json({ error: 'Result submission failed' });
  }
});

module.exports = router;
