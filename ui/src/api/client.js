const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:4000/api';

let authToken = null;
let onUnauthorized = null;
let onError = null;

export function setAuthToken(token) {
  authToken = token;
}

export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

// Called with a human-readable message whenever any request fails, so a single
// toast handler (wired up in ToastContext) can surface every API error without
// each page having to catch and display it individually.
export function setErrorHandler(fn) {
  onError = fn;
}

// zod's .flatten() shape is { formErrors: string[], fieldErrors: { [field]: string[] } }.
// Flatten both into one readable line instead of dumping the raw object.
function formatErrorMessage(data, status) {
  const err = data?.error;
  if (!err) return `Request failed (${status})`;
  if (typeof err === 'string') return err;

  const parts = [...(err.formErrors ?? [])];
  for (const [field, messages] of Object.entries(err.fieldErrors ?? {})) {
    if (messages?.length) parts.push(`${field}: ${messages.join(', ')}`);
  }
  return parts.length > 0 ? parts.join('; ') : `Request failed (${status})`;
}

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && authToken) {
    onUnauthorized?.();
  }

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = formatErrorMessage(data, res.status);
    onError?.(message);
    throw new Error(message);
  }
  return data;
}

export const api = {
  needsSetup: () => request('/auth/setup'),
  setup: (username, password) => request('/auth/setup', { method: 'POST', body: { username, password } }),
  login: (username, password) => request('/auth/login', { method: 'POST', body: { username, password } }),

  listUsers: () => request('/users'),
  createUser: (payload) => request('/users', { method: 'POST', body: payload }),

  listProjects: () => request('/projects'),
  createProject: (name) => request('/projects', { method: 'POST', body: { name } }),
  getProject: (projectId) => request(`/projects/${projectId}`),
  addMember: (projectId, userId) => request(`/projects/${projectId}/members`, { method: 'POST', body: { userId } }),
  removeMember: (projectId, userId) => request(`/projects/${projectId}/members/${userId}`, { method: 'DELETE' }),

  createBranch: (projectId, name) => request(`/projects/${projectId}/branches`, { method: 'POST', body: { name } }),
  updateBranchProtection: (projectId, branchId, payload) =>
    request(`/projects/${projectId}/branches/${branchId}/protection`, { method: 'PATCH', body: payload }),
  setBranchReviewers: (projectId, branchId, userIds) =>
    request(`/projects/${projectId}/branches/${branchId}/reviewers`, { method: 'PUT', body: { userIds } }),

  listEnvVars: (projectId, branchId) => request(`/projects/${projectId}/env/${branchId}`),
  submitEnvChanges: (projectId, branchId, changes) =>
    request(`/projects/${projectId}/env/${branchId}`, { method: 'POST', body: { changes } }),

  listPendingProposals: () => request('/proposals/pending'),
  listBranchProposals: (branchId, status) =>
    request(`/proposals/branch/${branchId}${status ? `?status=${status}` : ''}`),
  getProposal: (proposalId) => request(`/proposals/${proposalId}`),
  reviewProposal: (proposalId, decision, comment) =>
    request(`/proposals/${proposalId}/reviews`, { method: 'POST', body: { decision, comment } }),
};
