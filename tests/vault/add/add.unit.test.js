const { add } = require('../../../src/vault/add');
const config = require('../../../src/tools/config');
const crypto = require('../../../src/tools/crypto');

describe('vault/add', () => {
  let key, initialVault, encryptedVault;

  beforeEach(() => {
    key = 'key';
    initialVault = { account1: [{ userid: 'user1', password: 'pass', notes: '' }] };
    encryptedVault = crypto.encrypt(Buffer.from(JSON.stringify(initialVault)), key);
    jest.spyOn(config, 'getVaultData').mockReturnValue(encryptedVault.toString('base64'));
    jest.spyOn(config, 'setVaultData').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('should add new credentials for new account', () => {
    // For this test, start with an empty vault
    jest.spyOn(config, 'getVaultData').mockReturnValue(crypto.encrypt(Buffer.from(JSON.stringify({})), key).toString('base64'));
    expect(() => add(key, 'account1', { userid: 'user1', password: 'pass', notes: '' })).not.toThrow();
  });

  test('should throw error for duplicate userid', () => {
    // For this test, vault already contains user1
    expect(() => add(key, 'account1', { userid: 'user1', password: 'pass2', notes: '' })).toThrow('User ID already exists!');
  });
});