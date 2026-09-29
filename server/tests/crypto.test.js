import './setup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { encrypt, decrypt } from '../src/services/crypto.js';

test('encrypt then decrypt returns the original plaintext', () => {
  const plaintext = 'super-secret-value';
  const encrypted = encrypt(plaintext);
  assert.equal(decrypt(encrypted), plaintext);
});

test('encrypting the same value twice produces different ciphertext (random IV)', () => {
  const a = encrypt('same-value');
  const b = encrypt('same-value');
  assert.notEqual(a, b);
});

test('tampering with ciphertext breaks decryption (auth tag check)', () => {
  const encrypted = encrypt('tamper-test');
  const [iv, tag, data] = encrypted.split('.');
  const tampered = [iv, tag, data.slice(0, -2) + 'AA'].join('.');
  assert.throws(() => decrypt(tampered));
});
