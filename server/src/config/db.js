const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || './data/bytecode.db';
const dbDir = path.dirname(dbPath);

// Ensure data directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY,
      hostname TEXT,
      os TEXT,
      arch TEXT,
      pid INTEGER,
      api_key TEXT UNIQUE NOT NULL,
      internal_ip TEXT,
      last_seen TEXT DEFAULT (datetime('now')),
      first_seen TEXT DEFAULT (datetime('now')),
      status TEXT DEFAULT 'active',
      beacon_interval INTEGER DEFAULT 30,
      metadata TEXT DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      agent_id TEXT NOT NULL REFERENCES agents(id),
      type TEXT NOT NULL,
      payload TEXT DEFAULT '{}',
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT (datetime('now')),
      picked_at TEXT,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS results (
      id TEXT PRIMARY KEY,
      task_id TEXT REFERENCES tasks(id),
      agent_id TEXT NOT NULL REFERENCES agents(id),
      output TEXT,
      error TEXT,
      status TEXT DEFAULT 'success',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS operators (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_agent_status ON tasks(agent_id, status);
    CREATE INDEX IF NOT EXISTS idx_results_agent ON results(agent_id);
    CREATE INDEX IF NOT EXISTS idx_agents_api_key ON agents(api_key);
  `);

  console.log('[DB] Database initialized successfully');
}

module.exports = { db, initializeDatabase };
