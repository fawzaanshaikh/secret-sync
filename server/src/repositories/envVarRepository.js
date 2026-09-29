import { getDb } from '../db/connection.js';
import { encrypt, decrypt } from '../services/crypto.js';

function toPlain(row) {
  return {
    id: row.id,
    key: row.key,
    value: decrypt(row.value_encrypted),
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  };
}

export const envVarRepository = {
  listForBranch(branchId) {
    return getDb()
      .prepare('SELECT * FROM env_vars WHERE branch_id = ? ORDER BY key')
      .all(branchId)
      .map(toPlain);
  },

  upsert({ branchId, key, value, updatedBy }) {
    const db = getDb();
    db.prepare(
      `INSERT INTO env_vars (branch_id, key, value_encrypted, updated_by, updated_at)
       VALUES (?, ?, ?, ?, datetime('now'))
       ON CONFLICT(branch_id, key) DO UPDATE SET
         value_encrypted = excluded.value_encrypted,
         updated_by = excluded.updated_by,
         updated_at = excluded.updated_at`
    ).run(branchId, key, encrypt(value), updatedBy);
  },

  remove(branchId, key) {
    getDb().prepare('DELETE FROM env_vars WHERE branch_id = ? AND key = ?').run(branchId, key);
  },

  applyChanges(branchId, changes, updatedBy) {
    const db = getDb();
    const tx = db.transaction((items) => {
      for (const change of items) {
        if (change.action === 'delete') {
          this.remove(branchId, change.key);
        } else {
          this.upsert({ branchId, key: change.key, value: change.newValue, updatedBy });
        }
      }
    });
    tx(changes);
  },
};
