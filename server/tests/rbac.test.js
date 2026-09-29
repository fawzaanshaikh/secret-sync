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
