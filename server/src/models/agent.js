const { db } = require('../config/db');
const { generateId, generateApiKey } = require('../utils/crypto');

class Agent {
  /**
   * Register a new agent
   */
  static register({ hostname, os, arch, pid, internal_ip }) {
    const id = generateId();
    const api_key = generateApiKey();

    db.prepare(`
      INSERT INTO agents (id, hostname, os, arch, pid, api_key, internal_ip)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, hostname, os, arch, pid, api_key, internal_ip || null);

    return { id, api_key };
  }

  /**
   * Update last_seen timestamp for an agent
   */
  static updateLastSeen(agentId) {
    db.prepare(`
      UPDATE agents SET last_seen = datetime('now') WHERE id = ?
    `).run(agentId);
  }

  /**
   * Get all agents with computed online status
   */
  static getAll() {
    const agents = db.prepare(`
      SELECT *, 
        CASE 
          WHEN (julianday('now') - julianday(last_seen)) * 86400 < (beacon_interval * 3) 
          THEN 'online' 
          ELSE 'offline' 
        END as connection_status
      FROM agents 
      ORDER BY last_seen DESC
    `).all();

    return agents;
  }

  /**
   * Get a single agent by ID
   */
  static getById(id) {
    return db.prepare(`
      SELECT *,
        CASE 
          WHEN (julianday('now') - julianday(last_seen)) * 86400 < (beacon_interval * 3) 
          THEN 'online' 
          ELSE 'offline' 
        END as connection_status
      FROM agents WHERE id = ?
    `).get(id);
  }

  /**
   * Update agent beacon interval
   */
  static updateInterval(agentId, interval) {
    db.prepare(`
      UPDATE agents SET beacon_interval = ? WHERE id = ?
    `).run(interval, agentId);
  }

  /**
   * Update agent metadata
   */
  static updateMetadata(agentId, metadata) {
    db.prepare(`
      UPDATE agents SET metadata = ? WHERE id = ?
    `).run(JSON.stringify(metadata), agentId);
  }

  /**
   * Kill (deactivate) an agent
   */
  static kill(agentId) {
    db.prepare(`
      UPDATE agents SET status = 'killed' WHERE id = ?
    `).run(agentId);
  }

  /**
   * Get agent count stats
   */
  static getStats() {
    const total = db.prepare('SELECT COUNT(*) as count FROM agents').get().count;
    const active = db.prepare(`
      SELECT COUNT(*) as count FROM agents 
      WHERE (julianday('now') - julianday(last_seen)) * 86400 < (beacon_interval * 3)
      AND status = 'active'
    `).get().count;

    return { total, active, inactive: total - active };
  }
}

module.exports = Agent;
