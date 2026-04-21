const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { db } = require('../config/db');
const { generateId } = require('../utils/crypto');
const { generateToken, verifyToken } = require('../middleware/auth');

/**
 * POST /api/auth/login
 * Operator login - returns JWT token
 */
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const operator = db.prepare('SELECT * FROM operators WHERE username = ?').get(username);

    if (!operator) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = bcrypt.compareSync(password, operator.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(operator);

    console.log(`[AUTH] Operator ${username} logged in`);

    res.json({
      token,
      operator: {
        id: operator.id,
        username: operator.username
      }
    });
  } catch (err) {
    console.error('[AUTH] Error:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

/**
 * GET /api/auth/me
 * Get current operator info
 * Auth: JWT
 */
router.get('/me', verifyToken, (req, res) => {
  res.json({ operator: req.operator });
});

module.exports = router;
