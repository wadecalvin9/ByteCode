const { db } = require('../config/db');
const { generateId, generateApiKey } = require('../utils/crypto');

class Agent {
  /**
   * Register a new agent
   */
  static register({ hostname, os, arch, pid, internal_ip, server_pool }) {
    const id = generateId();
    const api_key = generateApiKey();

    db.prepare(`
      INSERT INTO agents (id, hostname, os, arch, pid, api_key, internal_ip, server_pool)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, hostname, os, arch, pid, api_key, internal_ip || null, JSON.stringify(server_pool || []));

    return { id, api_key };
  }

  /**
   * Update last_seen timestamp for an agent and handle geolocation
   */
  static updateLastSeen(agentId, ip) {
    // 1. Update timestamp and IP
    db.prepare(`
      UPDATE agents SET last_seen = datetime('now'), external_ip = ? WHERE id = ?
    `).run(ip, agentId);

    // 2. Handle Geolocation in background
    this.refreshGeoData(agentId, ip);
  }

  /**
   * Refresh geo data if IP changed or data is missing
   */
  static async refreshGeoData(agentId, ip) {
    try {
      const agent = this.getById(agentId);
      let metadata = {};
      try { metadata = JSON.parse(agent.metadata || '{}'); } catch(e) {}

      // Only refresh if IP changed or geo is missing
      if (metadata.geo && metadata.geo.ip === ip) return;

      const { getGeoData } = require('../utils/geo');
      const geo = await getGeoData(ip);
      
      if (geo) {
        metadata.geo = { ...geo, ip, timestamp: new Date().toISOString() };
        this.updateMetadata(agentId, metadata);
        console.log(`[GEO] Intelligence updated for ${agentId.slice(0, 8)}... (${geo.city}, ${geo.country})`);
      }
    } catch (err) {
      console.error('[GEO] Error:', err.message);
    }
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
   * Permanently remove an agent and all associated data
   */
  static remove(agentId) {
    db.transaction(() => {
      // Order is critical due to foreign key constraints:
      // 1. Delete results (depends on tasks and agents)
      db.prepare('DELETE FROM results WHERE agent_id = ?').run(agentId);
      // 2. Delete tasks (depends on agents)
      db.prepare('DELETE FROM tasks WHERE agent_id = ?').run(agentId);
      // 3. Delete agent
      db.prepare('DELETE FROM agents WHERE id = ?').run(agentId);
    })();
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
