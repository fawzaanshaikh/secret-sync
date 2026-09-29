import { getDb } from '../db/connection.js';
import { encrypt, decrypt } from '../services/crypto.js';

function changeToPlain(row) {
  return {
    id: row.id,
    key: row.key,
    action: row.action,
    newValue: row.new_value_encrypted ? decrypt(row.new_value_encrypted) : null,
  };
}

export const proposalRepository = {
  create({ branchId, proposedBy, changes }) {
    const db = getDb();
    const tx = db.transaction(() => {
      const result = db
        .prepare('INSERT INTO proposals (branch_id, proposed_by) VALUES (?, ?)')
        .run(branchId, proposedBy);
      const proposalId = result.lastInsertRowid;

      const insertChange = db.prepare(
        `INSERT INTO proposal_changes (proposal_id, key, action, new_value_encrypted)
         VALUES (?, ?, ?, ?)`
      );
      for (const change of changes) {
        insertChange.run(
          proposalId,
          change.key,
          change.action,
          change.action === 'delete' ? null : encrypt(change.newValue)
        );
      }
      return proposalId;
    });
    return this.findById(tx());
  },

  findById(id) {
    const db = getDb();
    const proposal = db.prepare('SELECT * FROM proposals WHERE id = ?').get(id);
    if (!proposal) return null;
    return this.hydrate(proposal);
  },

  hydrate(proposal) {
    const db = getDb();
    const changes = db
      .prepare('SELECT * FROM proposal_changes WHERE proposal_id = ?')
      .all(proposal.id)
      .map(changeToPlain);
    const reviews = db
      .prepare(
        `SELECT pr.*, u.username FROM proposal_reviews pr
         JOIN users u ON u.id = pr.reviewer_id
         WHERE pr.proposal_id = ?`
      )
      .all(proposal.id);
    return { ...proposal, changes, reviews };
  },

  listForBranch(branchId, status) {
    const db = getDb();
    const rows = status
      ? db
          .prepare('SELECT * FROM proposals WHERE branch_id = ? AND status = ? ORDER BY created_at DESC')
          .all(branchId, status)
      : db.prepare('SELECT * FROM proposals WHERE branch_id = ? ORDER BY created_at DESC').all(branchId);
    return rows.map((r) => this.hydrate(r));
  },

  listPendingForReviewer(userId) {
    // Pending proposals in projects the user belongs to, excluding their own proposals
    // and branches they've already reviewed.
    const db = getDb();
    const rows = db
      .prepare(
        `SELECT DISTINCT p.* FROM proposals p
         JOIN branches b ON b.id = p.branch_id
         JOIN project_members pm ON pm.project_id = b.project_id AND pm.user_id = ?
         WHERE p.status = 'pending'
           AND p.proposed_by != ?
           AND NOT EXISTS (
             SELECT 1 FROM proposal_reviews pr WHERE pr.proposal_id = p.id AND pr.reviewer_id = ?
           )
         ORDER BY p.created_at DESC`
      )
      .all(userId, userId, userId);
    return rows.map((r) => this.hydrate(r));
  },

  addReview(proposalId, { reviewerId, decision, comment }) {
    getDb()
      .prepare(
        `INSERT INTO proposal_reviews (proposal_id, reviewer_id, decision, comment)
         VALUES (?, ?, ?, ?)`
      )
      .run(proposalId, reviewerId, decision, comment ?? null);
  },

  resolve(proposalId, status) {
    getDb()
      .prepare(`UPDATE proposals SET status = ?, resolved_at = datetime('now') WHERE id = ?`)
      .run(status, proposalId);
  },
};
