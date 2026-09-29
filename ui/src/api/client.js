const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:4000/api';

let authToken = null;

export function setAuthToken(token) {
  authToken = token;
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

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message = data?.error?.formErrors?.join(', ') || data?.error || `Request failed (${res.status})`;
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message));
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
