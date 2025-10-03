const { show } = require('../../../src/vault/show');
const config = require('../../../src/tools/config');
const crypto = require('../../../src/tools/crypto');

describe('vault/show', () => {
  beforeEach(() => {
    const key = 'key';
    const vault = { acc: [{ userid: 'user1', password: 'p', notes: '' }] };
    const encrypted = crypto.encrypt(Buffer.from(JSON.stringify(vault)), key);
    jest.spyOn(config, 'getVaultData').mockReturnValue(encrypted.toString('base64'));
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should show credentials for account', () => {
    const key = 'key';
    const accountName = 'acc';
    expect(() => show(key, accountName)).not.toThrow();
  });
  test('should show all credentials if no account', () => {
    const key = 'key';
    expect(() => show(key)).not.toThrow();
  });
});