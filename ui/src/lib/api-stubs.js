// All backend, auth, and crypto calls are stubbed here. Nothing in this file
// talks to a real server or does real cryptography. Every stub returns
// realistic mock data (with a small artificial delay) so the UI can be
// built and tested end to end, and can later be swapped for a real
// implementation without restructuring any component.

const DELAY_MS = 350;

function delay(ms = DELAY_MS) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomId(prefix) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

// ---------------------------------------------------------------------------
// Mock data store
// ---------------------------------------------------------------------------

const CURRENT_USER = {
  id: 'usr_you',
  name: 'Fawzaan Shaikh',
  email: 'fawzi20112001@gmail.com',
};

const MEMBERS_BY_PROJECT = {
  proj_atlas: [
    { id: 'mem_1', name: 'Fawzaan Shaikh', email: 'fawzi20112001@gmail.com', role: 'admin', prodAccess: true },
    { id: 'mem_2', name: 'Priya Nair', email: 'priya@atlasco.dev', role: 'editor', prodAccess: true },
    { id: 'mem_3', name: 'Devon Cole', email: 'devon@atlasco.dev', role: 'editor', prodAccess: false },
    { id: 'mem_4', name: 'Sam Ortiz', email: 'sam@atlasco.dev', role: 'viewer', prodAccess: false },
  ],
  proj_ingest: [
    { id: 'mem_1', name: 'Fawzaan Shaikh', email: 'fawzi20112001@gmail.com', role: 'admin', prodAccess: true },
    { id: 'mem_5', name: 'Lena Petrova', email: 'lena@atlasco.dev', role: 'viewer', prodAccess: false },
  ],
  proj_billing: [
    { id: 'mem_1', name: 'Fawzaan Shaikh', email: 'fawzi20112001@gmail.com', role: 'viewer', prodAccess: false },
    { id: 'mem_6', name: 'Priya Nair', email: 'priya@atlasco.dev', role: 'admin', prodAccess: true },
  ],
};

const PROJECTS = [
  {
    id: 'proj_atlas',
    name: 'atlas-api',
    description: 'Core REST API for the Atlas platform.',
    role: 'admin',
    environments: [
      { id: 'env_dev', name: 'dev', sensitive: false },
      { id: 'env_uat', name: 'uat', sensitive: false },
      { id: 'env_prod', name: 'prod', sensitive: true },
    ],
  },
  {
    id: 'proj_ingest',
    name: 'ingest-worker',
    description: 'Background workers that process incoming event streams.',
    role: 'viewer',
    environments: [
      { id: 'env_dev', name: 'dev', sensitive: false },
      { id: 'env_prod', name: 'prod', sensitive: true },
    ],
  },
  {
    id: 'proj_billing',
    name: 'billing-service',
    description: 'Handles subscriptions, invoicing, and payment webhooks.',
    role: 'editor',
    environments: [
      { id: 'env_dev', name: 'dev', sensitive: false },
      { id: 'env_staging', name: 'staging', sensitive: false },
      { id: 'env_prod', name: 'prod', sensitive: true },
    ],
  },
];

const SECRET_SEED = {
  env_dev: [
    { key: 'DATABASE_URL', value: 'postgres://dev_user:dev_pass@localhost:5432/atlas_dev' },
    { key: 'REDIS_URL', value: 'redis://localhost:6379/0' },
    { key: 'JWT_SECRET', value: 'dev-only-not-a-real-secret' },
  ],
  env_uat: [
    { key: 'DATABASE_URL', value: 'postgres://uat_user:x7Fq9!kd@uat-db.internal:5432/atlas_uat' },
    { key: 'STRIPE_KEY', value: 'stripe-mock-key--uat-placeholder' },
  ],
  env_staging: [
    { key: 'DATABASE_URL', value: 'postgres://staging_user:s8Gh2@staging-db.internal:5432/billing_staging' },
    { key: 'STRIPE_KEY', value: 'stripe-mock-key--staging-placeholder' },
  ],
  env_prod: [
    { key: 'DATABASE_URL', value: 'postgres://prod_user:Zx9!mQ2vLp@prod-db.internal:5432/atlas_prod' },
    { key: 'REDIS_URL', value: 'redis://prod-cache.internal:6379/0' },
    { key: 'JWT_SECRET', value: 'K7pQ2vXz9mLwB4nR8tYc1Ae5Fh0Gj3Dk' },
    { key: 'STRIPE_KEY', value: 'stripe-mock-key--prod-placeholder' },
  ],
};

const SECRETS_BY_ENV = {};
function seedSecrets(envId) {
  if (!SECRETS_BY_ENV[envId]) {
    const seed = SECRET_SEED[envId] ?? [];
    SECRETS_BY_ENV[envId] = seed.map((s) => ({
      id: randomId('sec'),
      key: s.key,
      // In the real implementation this is ciphertext. Here it's just the
      // plaintext mock value, since decryptValue() is a no-op stub.
      encryptedValue: s.value,
      updatedAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30).toISOString(),
    }));
  }
  return SECRETS_BY_ENV[envId];
}

const AUDIT_ACTIONS = [
  { action: 'secret.reveal', resource: 'STRIPE_KEY (prod)' },
  { action: 'secret.create', resource: 'JWT_SECRET (dev)' },
  { action: 'secret.delete', resource: 'OLD_API_KEY (uat)' },
  { action: 'member.invite', resource: 'devon@atlasco.dev' },
  { action: 'member.role_change', resource: 'sam@atlasco.dev -> viewer' },
  { action: 'env.create', resource: 'staging' },
  { action: 'secret.pull', resource: 'CLI pull (prod)' },
  { action: 'project.create', resource: 'atlas-api' },
];

function seedAuditLog(projectId) {
  const members = MEMBERS_BY_PROJECT[projectId] ?? [];
  const entries = [];
  for (let i = 0; i < 18; i++) {
    const actor = members[Math.floor(Math.random() * members.length)] ?? CURRENT_USER;
    const template = AUDIT_ACTIONS[Math.floor(Math.random() * AUDIT_ACTIONS.length)];
    entries.push({
      id: randomId('log'),
      actorName: actor.name,
      actorEmail: actor.email,
      action: template.action,
      resource: template.resource,
      ip: `10.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      timestamp: new Date(Date.now() - i * 1000 * 60 * 60 * (3 + Math.random() * 9)).toISOString(),
    });
  }
  return entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// ---------------------------------------------------------------------------
// Auth stubs
// ---------------------------------------------------------------------------

/** TODO: implement real authentication against the backend. */
export async function loginUser(email, password) {
  await delay();
  if (!email || !password) {
    throw new Error('Email and password are required.');
  }
  const user = { ...CURRENT_USER, email };
  return { user, token: 'mock-jwt-token' };
}

/** TODO: implement real account creation against the backend. */
export async function signupUser(name, email, password) {
  await delay();
  if (!name || !email || !password) {
    throw new Error('Name, email, and password are required.');
  }
  const user = { id: randomId('usr'), name, email };
  return { user, token: 'mock-jwt-token' };
}

/** TODO: invalidate the real session / token on the backend. */
export async function logoutUser() {
  await delay(150);
  return { ok: true };
}

/** TODO: fetch the real current user from a session/token. */
export async function getCurrentUser() {
  await delay(150);
  return CURRENT_USER;
}

// ---------------------------------------------------------------------------
// Project stubs
// ---------------------------------------------------------------------------

/** TODO: fetch the real list of projects the user belongs to. */
export async function listProjects() {
  await delay();
  return PROJECTS.map(({ id, name, description, role }) => ({ id, name, description, role }));
}

/** TODO: fetch a single project's real detail, including environments. */
export async function getProject(projectId) {
  await delay();
  const project = PROJECTS.find((p) => p.id === projectId);
  if (!project) throw new Error('Project not found.');
  return project;
}

/** TODO: create a real project on the backend. */
export async function createProject({ name, description }) {
  await delay();
  const project = {
    id: randomId('proj'),
    name,
    description,
    role: 'admin',
    environments: [
      { id: randomId('env'), name: 'dev', sensitive: false },
      { id: randomId('env'), name: 'prod', sensitive: true },
    ],
  };
  PROJECTS.unshift(project);
  MEMBERS_BY_PROJECT[project.id] = [
    { id: 'mem_1', name: CURRENT_USER.name, email: CURRENT_USER.email, role: 'admin', prodAccess: true },
  ];
  return project;
}

// ---------------------------------------------------------------------------
// Environment stubs
// ---------------------------------------------------------------------------

/** TODO: create a real environment on the backend. */
export async function createEnvironment(projectId, name) {
  await delay();
  const project = PROJECTS.find((p) => p.id === projectId);
  if (!project) throw new Error('Project not found.');
  const env = {
    id: randomId('env'),
    name,
    sensitive: name.toLowerCase() === 'prod' || name.toLowerCase() === 'production',
  };
  project.environments.push(env);
  return env;
}

// ---------------------------------------------------------------------------
// Secret stubs (crypto happens client-side and is entirely stubbed here)
// ---------------------------------------------------------------------------

/** TODO: fetch real ciphertext blobs for this environment from the backend. */
export async function listSecrets(projectId, envId) {
  await delay();
  return seedSecrets(envId).map(({ id, key, updatedAt }) => ({ id, key, updatedAt }));
}

/**
 * TODO: fetch the ciphertext for one secret and decrypt it client-side with
 * the project's real encryption key. Currently returns the mock plaintext
 * directly since no real encryption is happening yet.
 */
export async function revealSecret(projectId, envId, secretId) {
  await delay(150);
  const secret = seedSecrets(envId).find((s) => s.id === secretId);
  if (!secret) throw new Error('Secret not found.');
  return decryptValue(secret.encryptedValue);
}

/** TODO: real client-side encryption before ciphertext is sent to the backend. */
export async function encryptValue(plaintext) {
  await delay(50);
  return plaintext;
}

/** TODO: real client-side decryption of ciphertext fetched from the backend. */
export async function decryptValue(ciphertext) {
  await delay(50);
  return ciphertext;
}

/** TODO: encrypt client-side and persist the ciphertext on the backend. */
export async function addSecret(projectId, envId, key, value) {
  await delay();
  const encryptedValue = await encryptValue(value);
  const secret = {
    id: randomId('sec'),
    key,
    encryptedValue,
    updatedAt: new Date().toISOString(),
  };
  seedSecrets(envId).push(secret);
  return { id: secret.id, key: secret.key, updatedAt: secret.updatedAt };
}

/** TODO: delete the real secret on the backend. */
export async function deleteSecret(projectId, envId, secretId) {
  await delay(200);
  const list = seedSecrets(envId);
  const idx = list.findIndex((s) => s.id === secretId);
  if (idx !== -1) list.splice(idx, 1);
  return { ok: true };
}

/** Not a backend call: builds the CLI command a user would run locally. */
export function getCliPullCommand(projectSlug, envName) {
  return `secretsync pull ${projectSlug} --env ${envName}`;
}

// ---------------------------------------------------------------------------
// Member stubs
// ---------------------------------------------------------------------------

/** TODO: fetch the real member list for this project. */
export async function listMembers(projectId) {
  await delay();
  return MEMBERS_BY_PROJECT[projectId] ?? [];
}

/** TODO: send a real invite (email + provisioning) on the backend. */
export async function inviteMember(projectId, email, role) {
  await delay();
  const member = {
    id: randomId('mem'),
    name: email.split('@')[0],
    email,
    role,
    prodAccess: false,
  };
  if (!MEMBERS_BY_PROJECT[projectId]) MEMBERS_BY_PROJECT[projectId] = [];
  MEMBERS_BY_PROJECT[projectId].push(member);
  return member;
}

/** TODO: persist the real role change on the backend. */
export async function updateMemberRole(projectId, memberId, role) {
  await delay(200);
  const member = (MEMBERS_BY_PROJECT[projectId] ?? []).find((m) => m.id === memberId);
  if (member) member.role = role;
  return member;
}

/** TODO: persist the real prod-access grant/revoke on the backend. */
export async function setProdAccess(projectId, memberId, enabled) {
  await delay(200);
  const member = (MEMBERS_BY_PROJECT[projectId] ?? []).find((m) => m.id === memberId);
  if (member) member.prodAccess = enabled;
  return member;
}

/** TODO: remove the real member on the backend. */
export async function removeMember(projectId, memberId) {
  await delay(200);
  const list = MEMBERS_BY_PROJECT[projectId] ?? [];
  const idx = list.findIndex((m) => m.id === memberId);
  if (idx !== -1) list.splice(idx, 1);
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Audit log stubs
// ---------------------------------------------------------------------------

const AUDIT_CACHE = {};

/** TODO: fetch the real audit log for this project from the backend. */
export async function listAuditLog(projectId) {
  await delay();
  if (!AUDIT_CACHE[projectId]) {
    AUDIT_CACHE[projectId] = seedAuditLog(projectId);
  }
  return AUDIT_CACHE[projectId];
}
