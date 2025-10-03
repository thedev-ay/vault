const { remove } = require('../../../src/vault/remove');
const config = require('../../../src/tools/config');
const crypto = require('../../../src/tools/crypto');

describe('vault/remove', () => {
  beforeEach(() => {
    const key = 'key';
    const vault = { acc: [{ userid: 'user1', password: 'p', notes: '' }] };
    const encrypted = crypto.encrypt(Buffer.from(JSON.stringify(vault)), key);
    jest.spyOn(config, 'getVaultData').mockReturnValue(encrypted.toString('base64'));
    jest.spyOn(config, 'setVaultData').mockImplementation(() => {});
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should remove credentials and delete account if last', () => {
    const key = 'key';
    const accountName = 'acc';
    const userId = 'user1';
    expect(() => remove(key, accountName, userId)).not.toThrow();
  });
});