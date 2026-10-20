import { freshDb } from './setup.js';
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { app } from '../src/app.js';

beforeEach(async () => {
  await freshDb();
});

test('first-run setup creates an admin, second call is rejected', async () => {
  const first = await request(app)
    .post('/api/auth/setup')
    .send({ username: 'root', password: 'rootpass123' });
  assert.equal(first.status, 201);
  assert.equal(first.body.user.role, 'admin');

  const second = await request(app)
    .post('/api/auth/setup')
    .send({ username: 'someoneelse', password: 'otherpass123' });
  assert.equal(second.status, 409);
});

test('member cannot create a project (admin-only route)', async () => {
  await request(app).post('/api/auth/setup').send({ username: 'admin1', password: 'adminpass123' });
  const adminLogin = await request(app).post('/api/auth/login').send({ username: 'admin1', password: 'adminpass123' });
  const adminToken = adminLogin.body.token;

  await request(app)
    .post('/api/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ username: 'member1', password: 'memberpass123', role: 'member' });

  const memberLogin = await request(app).post('/api/auth/login').send({ username: 'member1', password: 'memberpass123' });
  const memberToken = memberLogin.body.token;

  const res = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${memberToken}`)
    .send({ name: 'blocked-project' });

  assert.equal(res.status, 403);
});

test('non-member cannot read a project they are not part of', async () => {
  await request(app).post('/api/auth/setup').send({ username: 'admin2', password: 'adminpass123' });
  const adminLogin = await request(app).post('/api/auth/login').send({ username: 'admin2', password: 'adminpass123' });
  const adminToken = adminLogin.body.token;

  const projectRes = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'private-project' });
  const projectId = projectRes.body.id;

  await request(app)
    .post('/api/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ username: 'outsider', password: 'outsiderpass123', role: 'member' });
  const outsiderLogin = await request(app).post('/api/auth/login').send({ username: 'outsider', password: 'outsiderpass123' });
  const outsiderToken = outsiderLogin.body.token;

  const res = await request(app)
    .get(`/api/projects/${projectId}`)
    .set('Authorization', `Bearer ${outsiderToken}`);

  assert.equal(res.status, 403);
});

test('request without a token is rejected', async () => {
  const res = await request(app).get('/api/projects');
  assert.equal(res.status, 401);
});

test('writing to an unprotected branch applies immediately, no proposal needed', async () => {
  await request(app).post('/api/auth/setup').send({ username: 'admin3', password: 'adminpass123' });
  const adminLogin = await request(app).post('/api/auth/login').send({ username: 'admin3', password: 'adminpass123' });
  const adminToken = adminLogin.body.token;

  const projectRes = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'open-branch-project' });
  const projectId = projectRes.body.id;

  const branchRes = await request(app)
    .post(`/api/projects/${projectId}/branches`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'feature/x' });
  const branchId = branchRes.body.id;

  const writeRes = await request(app)
    .post(`/api/projects/${projectId}/env/${branchId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ changes: [{ key: 'A', action: 'add', newValue: '1' }] });

  assert.equal(writeRes.status, 200);
  assert.equal(writeRes.body[0].value, '1');
});

test('required approvals cannot exceed eligible reviewers (project members minus proposer)', async () => {
  await request(app).post('/api/auth/setup').send({ username: 'admin4', password: 'adminpass123' });
  const adminLogin = await request(app).post('/api/auth/login').send({ username: 'admin4', password: 'adminpass123' });
  const adminToken = adminLogin.body.token;

  const projectRes = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'approval-cap-project' });
  const projectId = projectRes.body.id;
  const project = await request(app)
    .get(`/api/projects/${projectId}`)
    .set('Authorization', `Bearer ${adminToken}`);
  const branchId = project.body.branches[0].id;

  // Only the creating admin is a member right now: 1 member -> max 0 possible approvals.
  const tooHigh = await request(app)
    .patch(`/api/projects/${projectId}/branches/${branchId}/protection`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ isProtected: true, requiredApprovals: 1 });
  assert.equal(tooHigh.status, 400);

  await request(app)
    .post('/api/users')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ username: 'member-cap-1', password: 'memberpass123', role: 'member' });
  const memberRes = await request(app)
    .get('/api/users')
    .set('Authorization', `Bearer ${adminToken}`);
  const memberId = memberRes.body.find((u) => u.username === 'member-cap-1').id;
  await request(app)
    .post(`/api/projects/${projectId}/members`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ userId: memberId });

  // Now 2 members -> max 1 possible approval. Requesting 2 should still fail.
  const stillTooHigh = await request(app)
    .patch(`/api/projects/${projectId}/branches/${branchId}/protection`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ isProtected: true, requiredApprovals: 2 });
  assert.equal(stillTooHigh.status, 400);

  const ok = await request(app)
    .patch(`/api/projects/${projectId}/branches/${branchId}/protection`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ isProtected: true, requiredApprovals: 1 });
  assert.equal(ok.status, 200);
});

test('restricting reviewers to fewer people than required approvals is rejected', async () => {
  await request(app).post('/api/auth/setup').send({ username: 'admin5', password: 'adminpass123' });
  const adminLogin = await request(app).post('/api/auth/login').send({ username: 'admin5', password: 'adminpass123' });
  const adminToken = adminLogin.body.token;

  const projectRes = await request(app)
    .post('/api/projects')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: 'reviewer-cap-project' });
  const projectId = projectRes.body.id;
  const project = await request(app)
    .get(`/api/projects/${projectId}`)
    .set('Authorization', `Bearer ${adminToken}`);
  const branchId = project.body.branches[0].id;

  for (const username of ['rev-cap-1', 'rev-cap-2']) {
    await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ username, password: 'memberpass123', role: 'member' });
  }
  const usersRes = await request(app).get('/api/users').set('Authorization', `Bearer ${adminToken}`);
  const rev1 = usersRes.body.find((u) => u.username === 'rev-cap-1').id;
  const rev2 = usersRes.body.find((u) => u.username === 'rev-cap-2').id;
  for (const userId of [rev1, rev2]) {
    await request(app)
      .post(`/api/projects/${projectId}/members`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ userId });
  }

  await request(app)
    .patch(`/api/projects/${projectId}/branches/${branchId}/protection`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ isProtected: true, requiredApprovals: 2 });

  // 2 required approvals, but restricting to a single reviewer can only ever produce 1.
  const res = await request(app)
    .put(`/api/projects/${projectId}/branches/${branchId}/reviewers`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ userIds: [rev1] });

  assert.equal(res.status, 400);
});
