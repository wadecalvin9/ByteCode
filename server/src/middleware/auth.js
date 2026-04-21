const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'bytecode_default_secret';

/**
 * Middleware: Verify JWT token for dashboard operators
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.operator = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

/**
 * Generate a JWT token for an operator
 */
function generateToken(operator) {
  return jwt.sign(
    { id: operator.id, username: operator.username },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

module.exports = { verifyToken, generateToken };
