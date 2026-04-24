const express = require('express');
const router = express.Router();
const Agent = require('../models/agent');

/**
 * POST /api/register
 * Register a new agent with the server
 * No auth required (first contact)
 */
router.post('/', (req, res) => {
  try {
    const { hostname, os, arch, pid, internal_ip, server_pool } = req.body;

    if (!hostname || !os) {
      return res.status(400).json({ error: 'hostname and os are required' });
    }

    const agent = Agent.register({ hostname, os, arch, pid, internal_ip, server_pool });

    console.log(`[REGISTER] New agent: ${hostname} (${os}/${arch}) -> ${agent.id}`);

    res.status(201).json({
      agent_id: agent.id,
      api_key: agent.api_key
    });
  } catch (err) {
    console.error('[REGISTER] Error:', err.message);
    res.status(500).json({ error: 'Registration failed' });
  }
});

module.exports = router;
