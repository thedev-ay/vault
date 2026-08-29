const { open, getCredentials, getAllCredentials } = require('../../../src/vault/common');
const config = require('../../../src/tools/config');
const crypto = require('../../../src/tools/crypto');
const nodeCrypto = require('crypto');

const encryptLegacy = (buffer, secret) => {
  const key = nodeCrypto.createHash('sha256').update(String(secret)).digest('base64').substr(0, 32);
  const iv = nodeCrypto.randomBytes(16);
  const cipher = nodeCrypto.createCipheriv('aes-256-ctr', key, iv);
  return Buffer.concat([iv, cipher.update(buffer), cipher.final()]);
};

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

  test('should migrate a legacy vault after opening it successfully', () => {
    const key = 'key';
    const vault = { acc: [{ userid: 'u', password: 'p', notes: '' }] };
    const encrypted = encryptLegacy(Buffer.from(JSON.stringify(vault)), key);
    jest.spyOn(config, 'getVaultData').mockReturnValue(encrypted.toString('base64'));
    const setVaultData = jest.spyOn(config, 'setVaultData').mockImplementation(() => {});

    expect(open(key)).toEqual(vault);
    expect(setVaultData).toHaveBeenCalledTimes(1);
    expect(crypto.isLegacy(Buffer.from(setVaultData.mock.calls[0][0], 'base64'))).toBe(false);
    jest.restoreAllMocks();
  });
});
