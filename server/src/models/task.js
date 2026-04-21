const { db } = require('../config/db');
const { generateId } = require('../utils/crypto');

class Task {
  /**
   * Create a new task for an agent
   */
  static create({ agent_id, type, payload }) {
    const id = generateId();
    const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload || {});

    db.prepare(`
      INSERT INTO tasks (id, agent_id, type, payload)
      VALUES (?, ?, ?, ?)
    `).run(id, agent_id, type, payloadStr);

    return { id, agent_id, type, payload: payloadStr, status: 'pending' };
  }

  /**
   * Get the next pending task for an agent (FIFO)
   */
  static getNextForAgent(agentId) {
    const task = db.prepare(`
      SELECT * FROM tasks 
      WHERE agent_id = ? AND status = 'pending'
      ORDER BY created_at ASC
      LIMIT 1
    `).get(agentId);

    if (task) {
      // Mark as picked
      db.prepare(`
        UPDATE tasks SET status = 'in_progress', picked_at = datetime('now')
        WHERE id = ?
      `).run(task.id);
      task.status = 'in_progress';
    }

    return task || null;
  }

  /**
   * Mark a task as completed
   */
  static complete(taskId) {
    db.prepare(`
      UPDATE tasks SET status = 'completed', completed_at = datetime('now')
      WHERE id = ?
    `).run(taskId);
  }

  /**
   * Mark a task as failed
   */
  static fail(taskId) {
    db.prepare(`
      UPDATE tasks SET status = 'failed', completed_at = datetime('now')
      WHERE id = ?
    `).run(taskId);
  }

  /**
   * Get all tasks for an agent
   */
  static getByAgent(agentId) {
    return db.prepare(`
      SELECT * FROM tasks WHERE agent_id = ? ORDER BY created_at DESC
    `).all(agentId);
  }

  /**
   * Get all tasks with optional status filter
   */
  static getAll(status = null) {
    if (status) {
      return db.prepare('SELECT * FROM tasks WHERE status = ? ORDER BY created_at DESC').all(status);
    }
    return db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
  }

  /**
   * Get task stats
   */
  static getStats() {
    const total = db.prepare('SELECT COUNT(*) as count FROM tasks').get().count;
    const pending = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'pending'").get().count;
    const completed = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'completed'").get().count;
    const failed = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'failed'").get().count;

    return { total, pending, completed, failed };
  }
}

module.exports = Task;
