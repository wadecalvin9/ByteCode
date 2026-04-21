const { db } = require('../config/db');
const { generateId } = require('../utils/crypto');

class Result {
  /**
   * Store a task result from an agent
   */
  static create({ task_id, agent_id, output, error, status }) {
    const id = generateId();

    db.prepare(`
      INSERT INTO results (id, task_id, agent_id, output, error, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, task_id, agent_id, output || '', error || null, status || 'success');

    return { id, task_id, agent_id, status };
  }

  /**
   * Get all results for an agent
   */
  static getByAgent(agentId) {
    return db.prepare(`
      SELECT r.*, t.type as task_type, t.payload as task_payload
      FROM results r
      LEFT JOIN tasks t ON r.task_id = t.id
      WHERE r.agent_id = ?
      ORDER BY r.created_at ASC
    `).all(agentId);
  }

  /**
   * Get result for a specific task
   */
  static getByTask(taskId) {
    return db.prepare(`
      SELECT * FROM results WHERE task_id = ?
    `).get(taskId);
  }

  /**
   * Get recent results across all agents
   */
  static getRecent(limit = 50) {
    return db.prepare(`
      SELECT r.*, t.type as task_type, a.hostname as agent_hostname
      FROM results r
      LEFT JOIN tasks t ON r.task_id = t.id
      LEFT JOIN agents a ON r.agent_id = a.id
      ORDER BY r.created_at DESC
      LIMIT ?
    `).all(limit);
  }
}

module.exports = Result;
