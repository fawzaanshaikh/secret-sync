import { getDb } from '../db/connection.js';

export const userRepository = {
  create({ username, passwordHash, role }) {
    const db = getDb();
    const result = db
      .prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)')
      .run(username, passwordHash, role);
    return this.findById(result.lastInsertRowid);
  },

  findById(id) {
    return getDb().prepare('SELECT id, username, role, created_at FROM users WHERE id = ?').get(id);
  },

  findByUsername(username) {
    return getDb().prepare('SELECT * FROM users WHERE username = ?').get(username);
  },

  countAll() {
    return getDb().prepare('SELECT COUNT(*) AS count FROM users').get().count;
  },

  listAll() {
    return getDb().prepare('SELECT id, username, role, created_at FROM users').all();
  },
};
