import { getDb } from '../db/connection.js';

export const branchRepository = {
  create({ projectId, name, isProtected = false, requiredApprovals = 1 }) {
    const db = getDb();
    const result = db
      .prepare(
        'INSERT INTO branches (project_id, name, is_protected, required_approvals) VALUES (?, ?, ?, ?)'
      )
      .run(projectId, name, isProtected ? 1 : 0, requiredApprovals);
    return this.findById(result.lastInsertRowid);
  },

  findById(id) {
    return getDb().prepare('SELECT * FROM branches WHERE id = ?').get(id);
  },

  listForProject(projectId) {
    return getDb().prepare('SELECT * FROM branches WHERE project_id = ? ORDER BY name').all(projectId);
  },

  updateProtection(id, { isProtected, requiredApprovals }) {
    getDb()
      .prepare('UPDATE branches SET is_protected = ?, required_approvals = ? WHERE id = ?')
      .run(isProtected ? 1 : 0, requiredApprovals, id);
    return this.findById(id);
  },

  setReviewers(branchId, userIds) {
    const db = getDb();
    const tx = db.transaction((ids) => {
      db.prepare('DELETE FROM branch_reviewers WHERE branch_id = ?').run(branchId);
      const insert = db.prepare('INSERT INTO branch_reviewers (branch_id, user_id) VALUES (?, ?)');
      for (const id of ids) insert.run(branchId, id);
    });
    tx(userIds);
  },

  listReviewers(branchId) {
    return getDb()
      .prepare(
        `SELECT u.id, u.username FROM users u
         JOIN branch_reviewers br ON br.user_id = u.id
         WHERE br.branch_id = ?`
      )
      .all(branchId);
  },
};
