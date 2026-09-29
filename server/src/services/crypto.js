import crypto from 'node:crypto';
import { config } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';

function getKey() {
  // Derive a fixed 32-byte key from the configured secret, regardless of its raw length.
  return crypto.createHash('sha256').update(config.encryptionKey).digest();
}

export function encrypt(plaintext) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(plaintext), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join('.');
}

export function decrypt(payload) {
  const [ivB64, authTagB64, dataB64] = payload.split('.');
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(authTagB64, 'base64'));
  const decrypted = Buffer.concat([decipher.update(Buffer.from(dataB64, 'base64')), decipher.final()]);
  return decrypted.toString('utf8');
}
