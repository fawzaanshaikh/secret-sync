import { getDb } from '../db/connection.js';

export const projectRepository = {
  create({ name, createdBy }) {
    const db = getDb();
    const result = db
      .prepare('INSERT INTO projects (name, created_by) VALUES (?, ?)')
      .run(name, createdBy);
    db.prepare('INSERT INTO project_members (project_id, user_id) VALUES (?, ?)').run(
      result.lastInsertRowid,
      createdBy
    );
    return this.findById(result.lastInsertRowid);
  },

  findById(id) {
    return getDb().prepare('SELECT * FROM projects WHERE id = ?').get(id);
  },

  listForUser(userId, role) {
    const db = getDb();
    if (role === 'admin') {
      return db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
    }
    return db
      .prepare(
        `SELECT p.* FROM projects p
         JOIN project_members pm ON pm.project_id = p.id
         WHERE pm.user_id = ?
         ORDER BY p.created_at DESC`
      )
      .all(userId);
  },

  isMember(projectId, userId) {
    const row = getDb()
      .prepare('SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?')
      .get(projectId, userId);
    return Boolean(row);
  },

  addMember(projectId, userId) {
    getDb()
      .prepare('INSERT OR IGNORE INTO project_members (project_id, user_id) VALUES (?, ?)')
      .run(projectId, userId);
  },

  removeMember(projectId, userId) {
    getDb().prepare('DELETE FROM project_members WHERE project_id = ? AND user_id = ?').run(projectId, userId);
  },

  listMembers(projectId) {
    return getDb()
      .prepare(
        `SELECT u.id, u.username, u.role FROM users u
         JOIN project_members pm ON pm.user_id = u.id
         WHERE pm.project_id = ?`
      )
      .all(projectId);
  },
};
