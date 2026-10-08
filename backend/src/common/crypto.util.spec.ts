import {
  encryptCitizenId,
  decryptCitizenId,
  maskCitizenId,
  validateThaiCitizenId,
} from './crypto.util';

describe('CryptoUtil', () => {
  const sampleCitizenId = '1410100000001';

  it('should encrypt and decrypt citizen ID accurately', () => {
    const encrypted = encryptCitizenId(sampleCitizenId);
    expect(encrypted).toBeDefined();
    expect(encrypted).not.toEqual(sampleCitizenId);

    const decrypted = decryptCitizenId(encrypted);
    expect(decrypted).toBe(sampleCitizenId);
  });

  it('should mask citizen ID adhering to BR-PDP-03 (1-2345-XXXXX-XX-1)', () => {
    const masked = maskCitizenId(sampleCitizenId);
    expect(masked).toBe('1-4101-XXXXX-XX-1');
  });

  it('should handle invalid or empty citizen ID gracefully', () => {
    expect(maskCitizenId('')).toBe('-');
    expect(maskCitizenId(null)).toBe('-');
    expect(maskCitizenId('123')).toBe('X-XXXX-XXXXX-XX-X');
  });

  describe('validateThaiCitizenId (BR-IMP-06 / FR-IMP-05)', () => {
    it('should validate valid Thai citizen ID with Mod-11 checksum', () => {
      // 1100500123451 has valid Mod-11 check digit 1
      expect(validateThaiCitizenId('1100500123451', false)).toBe(true);
      expect(validateThaiCitizenId('1-1005-00123-45-1', false)).toBe(true);
    });

    it('should reject invalid length or format', () => {
      expect(validateThaiCitizenId('')).toBe(false);
      expect(validateThaiCitizenId(null)).toBe(false);
      expect(validateThaiCitizenId('12345')).toBe(false);
      expect(validateThaiCitizenId('110050012345A')).toBe(false);
    });

    it('should reject all-identical digits', () => {
      expect(validateThaiCitizenId('0000000000000')).toBe(false);
      expect(validateThaiCitizenId('1111111111111')).toBe(false);
    });

    it('should reject incorrect checksum digit in strict mode', () => {
      // 1100500123459 has wrong check digit (expected 1)
      expect(validateThaiCitizenId('1100500123459', false)).toBe(false);
    });

    it('should accept sample mock prefix in non-production environments', () => {
      expect(validateThaiCitizenId('1410100000001', true)).toBe(true);
      expect(validateThaiCitizenId('1410100000001', false)).toBe(false);
    });
  });
});
