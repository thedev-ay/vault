const { update } = require('../../../src/vault/update');
const config = require('../../../src/tools/config');
const crypto = require('../../../src/tools/crypto');

describe('vault/update', () => {
  const key = 'key';
  const vault = { acc: [{ userid: 'user1', password: 'p', notes: '' }] };

  beforeEach(() => {
    const encrypted = crypto.encrypt(Buffer.from(JSON.stringify(vault)), key);
    jest.spyOn(config, 'getVaultData').mockReturnValue(encrypted.toString('base64'));
    jest.spyOn(config, 'setVaultData').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should update existing credentials', () => {
    update(key, 'acc', { userid: 'user1', password: 'new-password', notes: 'new notes' });

    const encrypted = Buffer.from(config.setVaultData.mock.calls[0][0], 'base64');
    const updated = JSON.parse(crypto.decrypt(encrypted, key).toString());
    expect(updated.schemaVersion).toBe(1);
    expect(updated.credentials[0]).toEqual(expect.objectContaining({
      account: 'acc', userid: 'user1', password: 'new-password', notes: 'new notes'
    }));
  });

  test('should reject a missing user ID without rewriting the vault', () => {
    expect(() => update(key, 'acc', { userid: 'missing', password: 'new-password' }))
      .toThrow('User ID not found!');
    expect(config.setVaultData).not.toHaveBeenCalled();
  });

  test('should reject a missing account without rewriting the vault', () => {
    expect(() => update(key, 'missing', { userid: 'user1', password: 'new-password' }))
      .toThrow('Account not found!');
    expect(config.setVaultData).not.toHaveBeenCalled();
  });
});
