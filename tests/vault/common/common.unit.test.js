const { open, getCredentials, getAllCredentials } = require('../../../src/vault/common');
const config = require('../../../src/tools/config');
const crypto = require('../../../src/tools/crypto');

describe('vault/common', () => {
  test('should throw error if vault is locked', () => {
    jest.spyOn(config, 'getVaultData').mockReturnValue('invalid');
    expect(() => open('wrongkey')).toThrow('Vault locked!');
    jest.restoreAllMocks();
  });

  test('should throw error if account not found', () => {
    expect(() => getCredentials({}, 'missing')).toThrow('Account not found!');
  });

  test('should get all credentials', () => {
    const accounts = { acc: [{ userid: 'u', password: 'p', notes: '' }] };
    const all = getAllCredentials(accounts);
    expect(all.length).toBe(1);
    expect(all[0].account).toBe('acc');
  });

  test('should open vault with valid data', () => {
    const key = 'key';
    const vault = { acc: [{ userid: 'u', password: 'p', notes: '' }] };
    const encrypted = crypto.encrypt(Buffer.from(JSON.stringify(vault)), key);
    jest.spyOn(config, 'getVaultData').mockReturnValue(encrypted.toString('base64'));
    const result = open(key);
    expect(result.acc[0].userid).toBe('u');
    jest.restoreAllMocks();
  });
});