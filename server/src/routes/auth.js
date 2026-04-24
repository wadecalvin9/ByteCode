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

/**
 * POST /api/auth/change-password
 * Change current operator password
 * Auth: JWT
 */
router.post('/change-password', verifyToken, (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ error: 'Old and new passwords required' });
    }

    // Get operator from DB (not just token info to be safe)
    const operator = db.prepare('SELECT * FROM operators WHERE id = ?').get(req.operator.id);

    if (!operator) {
      return res.status(404).json({ error: 'Operator not found' });
    }

    // Verify old password
    const validPassword = bcrypt.compareSync(oldPassword, operator.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid current password' });
    }

    // Update with new password
    const newHash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE operators SET password_hash = ? WHERE id = ?').run(newHash, operator.id);

    console.log(`[AUTH] Operator ${operator.username} changed their password`);
    res.json({ ok: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('[AUTH] Change password error:', err.message);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;
