const { decrypt, encrypt } = require('../utils/crypto');
const rawBody = require('raw-body');

/**
 * Middleware to handle encrypted agent traffic
 */
async function handleEncryptedTraffic(req, res, next) {
  if (req.headers['x-encrypted'] === 'true') {
    try {
      // We need the raw buffer to decrypt
      const buffer = await rawBody(req);
      const decrypted = decrypt(buffer);
      
      // Try to parse as JSON if it looks like JSON
      try {
        req.body = JSON.parse(decrypted);
      } catch (e) {
        req.body = decrypted;
      }
      
      // Override res.json to encrypt the response
      const originalJson = res.json;
      res.json = function(body) {
        const jsonString = JSON.stringify(body);
        const encrypted = encrypt(jsonString);
        res.set('X-Encrypted', 'true');
        res.set('Content-Type', 'application/octet-stream');
        return res.send(encrypted);
      };
      
      next();
    } catch (err) {
      console.error('[CRYPTO] Decryption failed:', err.message);
      res.status(400).json({ error: 'Decryption failed' });
    }
  } else {
    next();
  }
}

module.exports = { handleEncryptedTraffic };
