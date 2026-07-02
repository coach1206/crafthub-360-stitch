/**
 * Secure token encryption utility for CraftHub 360 Stitch.
 * Uses AES-256-CBC via Node's built-in crypto module.
 *
 * Reads ENCRYPTION_SECRET or TOKEN_ENCRYPTION_KEY from process.env.
 * If missing → returns { status: 'encryption_key_required' }.
 * Never logs raw values.
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;  // 128 bits

/**
 * Resolve and validate the encryption key from environment.
 * Returns a 32-byte Buffer, or null if unavailable.
 */
function resolveEncryptionKey() {
  const raw = process.env.ENCRYPTION_SECRET || process.env.TOKEN_ENCRYPTION_KEY;
  if (!raw) return null;

  // Derive a 32-byte key from whatever length string was provided
  return crypto.createHash('sha256').update(raw).digest();
}

/**
 * Check whether the encryption key is configured.
 * @returns {{ available: boolean, status: string }}
 */
export function getEncryptionStatus() {
  const key = resolveEncryptionKey();
  if (!key) {
    return {
      available: false,
      status: 'encryption_key_required',
      message:
        'No encryption key configured. Set ENCRYPTION_SECRET or TOKEN_ENCRYPTION_KEY.',
    };
  }
  return {
    available: true,
    status: 'audit_logged',
    message: 'Encryption key present.',
  };
}

/**
 * Encrypt a plaintext string value.
 * @param {string} value
 * @returns {{ ciphertext: string } | { status: 'encryption_key_required' }}
 */
export function encryptSecret(value) {
  const key = resolveEncryptionKey();
  if (!key) {
    return { status: 'encryption_key_required' };
  }

  if (typeof value !== 'string' || value.length === 0) {
    return { status: 'provider_error', safeMessage: 'Value to encrypt must be a non-empty string.' };
  }

  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(value, 'utf8'),
      cipher.final(),
    ]);
    // Store as iv:ciphertext, both hex-encoded
    const result = `${iv.toString('hex')}:${encrypted.toString('hex')}`;
    return { ciphertext: result };
  } catch (err) {
    // Never leak the error detail to callers — it could contain key info
    return {
      status: 'provider_error',
      safeMessage: 'Encryption failed. Check server logs.',
    };
  }
}

/**
 * Decrypt a ciphertext string previously produced by encryptSecret().
 * @param {string} ciphertext  Format: "<iv_hex>:<data_hex>"
 * @returns {{ plaintext: string } | { status: string }}
 */
export function decryptSecret(ciphertext) {
  const key = resolveEncryptionKey();
  if (!key) {
    return { status: 'encryption_key_required' };
  }

  if (typeof ciphertext !== 'string' || !ciphertext.includes(':')) {
    return {
      status: 'provider_error',
      safeMessage: 'Ciphertext format invalid. Expected iv_hex:data_hex.',
    };
  }

  try {
    const [ivHex, dataHex] = ciphertext.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const data = Buffer.from(dataHex, 'hex');

    if (iv.length !== IV_LENGTH) {
      return { status: 'provider_error', safeMessage: 'IV length invalid.' };
    }

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return { plaintext: decrypted.toString('utf8') };
  } catch (err) {
    return {
      status: 'provider_error',
      safeMessage: 'Decryption failed. Token may be corrupt or key mismatch.',
    };
  }
}

/**
 * Mask a secret value for safe display.
 * Returns first 4 chars + '****'.
 * @param {string} value
 * @returns {string}
 */
export function maskSecret(value) {
  if (typeof value !== 'string' || value.length === 0) return '****';
  const visible = value.slice(0, 4);
  return `${visible}****`;
}
