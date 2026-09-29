import fs from 'node:fs';
import path from 'node:path';

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.ENCRYPTION_KEY = 'test-encryption-key';

const tmpDir = path.join(process.cwd(), 'tests', '.tmp');
fs.mkdirSync(tmpDir, { recursive: true });

let counter = 0;

// Gives each test its own throwaway SQLite file and a fresh connection,
// so tests in the same file never see each other's rows.
export async function freshDb() {
  const { resetDbForTests } = await import('../src/db/connection.js');
  counter += 1;
  const dbPath = path.join(tmpDir, `test-${process.pid}-${Date.now()}-${counter}.db`);
  return resetDbForTests(dbPath);
}
