const crypto = require('../../src/tools/crypto');

describe('tools/crypto', () => {
  test('encrypt and decrypt should work', () => {
    const text = 'secret';
    const secret = 'password123';
    const encrypted = crypto.encrypt(Buffer.from(text), secret);
    const decrypted = crypto.decrypt(encrypted, secret);
    expect(decrypted.toString()).toBe(text);
  });
});