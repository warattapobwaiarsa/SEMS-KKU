import { encryptCitizenId, decryptCitizenId, maskCitizenId } from './crypto.util';

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
});
