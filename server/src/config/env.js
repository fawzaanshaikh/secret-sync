import 'dotenv/config';

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  dbPath: process.env.DB_PATH ?? './data/secretsync.db',
  jwtSecret: required('JWT_SECRET', 'dev-secret-change-me'),
  encryptionKey: required('ENCRYPTION_KEY', 'dev-encryption-key-change-me-32b'),
};
