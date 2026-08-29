const nodeCrypto = require('crypto');
const crypto = require('../../src/tools/crypto');

const encryptLegacy = (buffer, secret) => {
  const key = nodeCrypto.createHash('sha256').update(String(secret)).digest('base64').substr(0, 32);
  const iv = nodeCrypto.randomBytes(16);
  const cipher = nodeCrypto.createCipheriv('aes-256-ctr', key, iv);
  return Buffer.concat([iv, cipher.update(buffer), cipher.final()]);
};

const createVersionedFixture = (buffer, secret, version, parallelization) => {
  const magic = Buffer.from(version);
  const salt = Buffer.alloc(16, 1);
  const iv = Buffer.alloc(12, 2);
  const key = nodeCrypto.scryptSync(String(secret), salt, 32, {
    N: 32768,
    r: 8,
    p: parallelization,
    maxmem: 64 * 1024 * 1024
  });
  const cipher = nodeCrypto.createCipheriv('aes-256-gcm', key, iv, { authTagLength: 16 });
  cipher.setAAD(magic);
  const ciphertext = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return Buffer.concat([magic, salt, iv, cipher.getAuthTag(), ciphertext]);
};

describe('tools/crypto', () => {
  test('encrypt and decrypt should work', () => {
    const text = 'secret';
    const secret = 'password123';
    const encrypted = crypto.encrypt(Buffer.from(text), secret);
    const decrypted = crypto.decrypt(encrypted, secret);
    expect(decrypted.toString()).toBe(text);
  });

  test('new vaults use the versioned authenticated format', () => {
    const encrypted = crypto.encrypt(Buffer.from('secret'), 'password123');
    expect(encrypted.subarray(0, 4).toString()).toBe('VLT3');
    expect(crypto.isLegacy(encrypted)).toBe(false);
    expect(crypto.needsUpgrade(encrypted)).toBe(false);
  });

  test('should reject the wrong password', () => {
    const encrypted = crypto.encrypt(Buffer.from('secret'), 'correct-password');
    expect(() => crypto.decrypt(encrypted, 'wrong-password')).toThrow();
  });

  test('should reject tampered ciphertext', () => {
    const encrypted = crypto.encrypt(Buffer.from('secret'), 'password123');
    encrypted[encrypted.length - 1] ^= 1;
    expect(() => crypto.decrypt(encrypted, 'password123')).toThrow();
  });

  test('should decrypt legacy vaults', () => {
    const encrypted = encryptLegacy(Buffer.from('legacy secret'), 'password123');
    expect(crypto.isLegacy(encrypted)).toBe(true);
    expect(crypto.decrypt(encrypted, 'password123').toString()).toBe('legacy secret');
  });

  test('should preserve the fixed VLT2 scrypt profile', () => {
    const encrypted = createVersionedFixture(Buffer.from('compatible'), 'password123', 'VLT2', 1);
    expect(crypto.decrypt(encrypted, 'password123').toString()).toBe('compatible');
    expect(crypto.needsUpgrade(encrypted)).toBe(true);
  });

  test('should preserve the fixed VLT3 scrypt profile', () => {
    const encrypted = createVersionedFixture(Buffer.from('compatible'), 'password123', 'VLT3', 3);
    expect(crypto.decrypt(encrypted, 'password123').toString()).toBe('compatible');
    expect(crypto.needsUpgrade(encrypted)).toBe(false);
  });
});
