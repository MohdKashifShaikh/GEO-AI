import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

/**
 * AES-256-GCM encryption service for securing API keys and sensitive data.
 *
 * Format: `base64(iv[12] + authTag[16] + ciphertext)`
 *
 * **Note:** This class uses `node:crypto` and cannot be used in Edge Runtime.
 * For Edge-compatible hashing, see `CrawlTracker.anonymizeIp()` which uses `crypto.subtle`.
 */
export class CryptoService {
  private readonly key: Buffer;

  /**
   * @param encryptionKey — 64-character hex string (32 bytes for AES-256)
   * @throws {Error} if the key is not exactly 64 hex characters
   */
  constructor(encryptionKey: string) {
    if (!/^[0-9a-fA-F]{64}$/.test(encryptionKey)) {
      throw new Error(
        'Encryption key must be exactly 64 hex characters (32 bytes for AES-256)',
      );
    }
    this.key = Buffer.from(encryptionKey, 'hex');
  }

  /**
   * Encrypts plaintext using AES-256-GCM.
   * @returns base64(iv + authTag + ciphertext)
   */
  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });

    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    const combined = Buffer.concat([iv, authTag, encrypted]);
    return combined.toString('base64');
  }

  /**
   * Decrypts a value previously encrypted with `encrypt()`.
   * Expects base64(iv + authTag + ciphertext).
   * @throws {Error} if the encrypted data is too short or corrupted
   */
  decrypt(encrypted: string): string {
    const combined = Buffer.from(encrypted, 'base64');

    if (combined.length < IV_LENGTH + AUTH_TAG_LENGTH) {
      throw new Error(
        'Invalid encrypted data: too short to contain IV and auth tag',
      );
    }

    const iv = combined.subarray(0, IV_LENGTH);
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const ciphertext = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    const decipher = createDecipheriv(ALGORITHM, this.key, iv, {
      authTagLength: AUTH_TAG_LENGTH,
    });
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return decrypted.toString('utf8');
  }
}
