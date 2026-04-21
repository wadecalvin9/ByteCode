const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

/**
 * Generate a unique ID (UUID v4)
 */
function generateId() {
  return uuidv4();
}

/**
 * Generate a random API key for agent authentication
 */
function generateApiKey() {
  return crypto.randomBytes(32).toString('hex');
}

module.exports = { generateId, generateApiKey };
