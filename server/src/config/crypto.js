/**
 * Pre-shared key for agent traffic encryption
 * Must match the agent's DefaultEncryptionKey
 */
const PSK = process.env.BYTECODE_PSK || 'bytecode-c2-project-secret-key!!';

module.exports = { PSK };
