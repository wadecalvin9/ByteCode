/**
 * Seed script - creates a default operator account
 * Run with: npm run seed
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { db, initializeDatabase } = require('../config/db');
const { generateId } = require('./crypto');

initializeDatabase();

const username = 'admin';
const password = 'bytecode';

// Check if already exists
const existing = db.prepare('SELECT id FROM operators WHERE username = ?').get(username);

if (existing) {
  console.log(`[SEED] Operator '${username}' already exists`);
  process.exit(0);
}

const passwordHash = bcrypt.hashSync(password, 10);
const id = generateId();

db.prepare(`
  INSERT INTO operators (id, username, password_hash)
  VALUES (?, ?, ?)
`).run(id, username, passwordHash);

console.log(`[SEED] Created operator account:`);
console.log(`  Username: ${username}`);
console.log(`  Password: ${password}`);
console.log(`  ID: ${id}`);
console.log(`\n⚠️  Change these credentials in production!`);
