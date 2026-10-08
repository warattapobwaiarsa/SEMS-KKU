import * as crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recommended for AES-GCM

function getEncryptionKey(): Buffer {
  const secret =
    process.env.AES_CITIZEN_ID_KEY || 'default-secret-key-for-development-32b';
  // Derive a guaranteed 32-byte (256-bit) key using SHA-256
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypt a Citizen ID using AES-256-GCM (BR-PDP-06)
 * Output format: <iv_hex>:<auth_tag_hex>:<cipher_hex>
 */
export function encryptCitizenId(citizenId: string): string {
  if (!citizenId) return '';
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(citizenId, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt a Citizen ID from AES-256-GCM (BR-PDP-04)
 */
export function decryptCitizenId(encryptedValue: string): string {
  if (!encryptedValue) return '';
  const parts = encryptedValue.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted format for citizen ID');
  }

  const [ivHex, authTagHex, cipherHex] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Mask Citizen ID according to BR-PDP-03:
 * รูปแบบ 1-2345-XXXXX-XX-1 (เปิดเผยหลักที่ 1, 2-5 และ 13)
 */
export function maskCitizenId(rawCitizenId: string | null | undefined): string {
  if (!rawCitizenId) return '-';
  const clean = rawCitizenId.replace(/\D/g, '');
  if (clean.length !== 13) {
    return 'X-XXXX-XXXXX-XX-X';
  }
  return `${clean[0]}-${clean.slice(1, 5)}-XXXXX-XX-${clean[12]}`;
}

/**
 * Validate Thai Citizen ID according to BR-IMP-06 & FR-IMP-05:
 * 1. Must be 13 digits
 * 2. Cannot be identical numbers throughout (e.g., 0000000000000, 1111111111111)
 * 3. Satisfies Mod-11 Checksum: (11 - (sum(d[i] * (13-i)) % 11)) % 10 === d[12]
 * Note: If allowMockPrefix is true (default in dev/test), permits project dummy sample IDs starting with 14101000000
 */
export function validateThaiCitizenId(
  rawCitizenId: string | null | undefined,
  allowMockPrefix: boolean = process.env.NODE_ENV !== 'production',
): boolean {
  if (!rawCitizenId) return false;
  const clean = rawCitizenId.replace(/[\s-]/g, '');
  if (!/^\d{13}$/.test(clean)) return false;

  // Reject all identical digits
  if (/^(\d)\1{12}$/.test(clean)) return false;

  // Accept sample dataset mock prefix for non-production environments
  if (allowMockPrefix && clean.startsWith('14101000000')) {
    return true;
  }

  // Mod-11 Checksum calculation
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(clean[i], 10) * (13 - i);
  }
  const checkDigit = (11 - (sum % 11)) % 10;
  return checkDigit === parseInt(clean[12], 10);
}
