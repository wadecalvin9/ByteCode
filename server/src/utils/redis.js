const redis = require('redis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
let client = null;
let connectionAttempted = false;

async function connect() {
  if (connectionAttempted) return client;
  connectionAttempted = true;

  const tempClient = redis.createClient({
    url: REDIS_URL,
    socket: {
      reconnectStrategy: false // Disable aggressive retries for local npm usage
    }
  });

  tempClient.on('error', (err) => {
    // Only log error once to keep console clean
    if (!client) {
      // Intentionally silent after the first fail to avoid spam
    }
  });

  try {
    await tempClient.connect();
    console.log('\x1b[32m[REDIS]\x1b[0m State persistence engine: ONLINE');
    client = tempClient;
  } catch (err) {
    console.log('\x1b[33m[REDIS]\x1b[0m Connection bypassed. Using local SQL fallback.');
    client = null;
  }

  return client;
}

function getClient() {
  return client;
}

module.exports = { connect, getClient };
