import { vi, test, expect, beforeEach, afterEach } from 'vitest';
import { api, setErrorHandler } from './client.js';

function mockFetchOnce(status, body) {
  global.fetch = vi.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    json: async () => body,
  });
}

afterEach(() => {
  setErrorHandler(null);
  vi.restoreAllMocks();
});

test('flattens zod fieldErrors into a readable message instead of raw JSON', async () => {
  mockFetchOnce(400, {
    error: { formErrors: [], fieldErrors: { requiredApprovals: ['Number must be less than or equal to 10'] } },
  });
  const onError = vi.fn();
  setErrorHandler(onError);

  await expect(api.listProjects()).rejects.toThrow('requiredApprovals: Number must be less than or equal to 10');
  expect(onError).toHaveBeenCalledWith('requiredApprovals: Number must be less than or equal to 10');
});

test('passes through a plain string error unchanged', async () => {
  mockFetchOnce(409, { error: 'Username already taken' });
  const onError = vi.fn();
  setErrorHandler(onError);

  await expect(api.listProjects()).rejects.toThrow('Username already taken');
  expect(onError).toHaveBeenCalledWith('Username already taken');
});

test('does not call the error handler on a successful request', async () => {
  mockFetchOnce(200, []);
  const onError = vi.fn();
  setErrorHandler(onError);

  await api.listProjects();
  expect(onError).not.toHaveBeenCalled();
});
