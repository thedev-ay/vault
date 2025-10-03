const { list } = require('../../../src/vault/list');
const config = require('../../../src/tools/config');
const crypto = require('../../../src/tools/crypto');

describe('vault/list', () => {
  beforeEach(() => {
    // Encrypt an empty vault with the test key
    const key = 'key';
    const encrypted = crypto.encrypt(Buffer.from(JSON.stringify({})), key);
    const base64Vault = encrypted.toString('base64');
    jest.spyOn(config, 'getVaultData').mockReturnValue(base64Vault);
  });
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should list accounts', () => {
    const key = 'key';
    expect(() => list(key)).not.toThrow();
  });
});