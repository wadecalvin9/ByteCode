const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const { PSK } = require('../config/crypto');

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

/**
 * Encrypt data using AES-256-GCM
 */
function encrypt(plaintext) {
  const nonce = crypto.randomBytes(12); // GCM standard nonce size
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(PSK), nonce);
  
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final()
  ]);
  
  const authTag = cipher.getAuthTag();
  
  // Return nonce + ciphertext + authTag
  return Buffer.concat([nonce, ciphertext, authTag]);
}

/**
 * Decrypt data using AES-256-GCM
 */
function decrypt(data) {
  const nonce = data.slice(0, 12);
  const authTag = data.slice(data.length - 16);
  const ciphertext = data.slice(12, data.length - 16);
  
  const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(PSK), nonce);
  decipher.setAuthTag(authTag);
  
  const plaintext = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final()
  ]);
  
  return plaintext.toString('utf8');
}

module.exports = { generateId, generateApiKey, encrypt, decrypt };
