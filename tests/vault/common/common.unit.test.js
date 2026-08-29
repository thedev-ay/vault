const { open, getAccountCredentials, getCredentials, getAllCredentials, validateVaultData } = require('../../../src/vault/common');
const config = require('../../../src/tools/config');
const crypto = require('../../../src/tools/crypto');
const nodeCrypto = require('crypto');

const encryptLegacy = (buffer, secret) => {
  const key = nodeCrypto.createHash('sha256').update(String(secret)).digest('base64').substr(0, 32);
  const iv = nodeCrypto.randomBytes(16);
  const cipher = nodeCrypto.createCipheriv('aes-256-ctr', key, iv);
  return Buffer.concat([iv, cipher.update(buffer), cipher.final()]);
};

const encryptV2 = (buffer, secret) => {
  const magic = Buffer.from('VLT2');
  const salt = Buffer.alloc(16, 1);
  const iv = Buffer.alloc(12, 2);
  const key = nodeCrypto.scryptSync(String(secret), salt, 32, {
    N: 32768,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024
  });
  const cipher = nodeCrypto.createCipheriv('aes-256-gcm', key, iv, { authTagLength: 16 });
  cipher.setAAD(magic);
  const ciphertext = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return Buffer.concat([magic, salt, iv, cipher.getAuthTag(), ciphertext]);
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

  test('should decorate display credentials without mutating stored data', () => {
    const accounts = { acc: [{ userid: 'u', password: 'p', notes: '' }] };
    const original = JSON.parse(JSON.stringify(accounts));

    expect(getCredentials(accounts, 'acc')[0].account).toBe('acc');
    expect(getAllCredentials(accounts)[0].account).toBe('acc');
    expect(accounts).toEqual(original);
    expect(getAccountCredentials(accounts, 'acc')).toBe(accounts.acc);
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

  test('should migrate a VLT2 vault after opening it successfully', () => {
    const key = 'key';
    const vault = { acc: [{ userid: 'u', password: 'p', notes: '' }] };
    const encrypted = encryptV2(Buffer.from(JSON.stringify(vault)), key);
    jest.spyOn(config, 'getVaultData').mockReturnValue(encrypted.toString('base64'));
    const setVaultData = jest.spyOn(config, 'setVaultData').mockImplementation(() => {});

    expect(open(key)).toEqual(vault);
    expect(setVaultData).toHaveBeenCalledTimes(1);
    expect(Buffer.from(setVaultData.mock.calls[0][0], 'base64').subarray(0, 4).toString()).toBe('VLT3');
    jest.restoreAllMocks();
  });

  test('should validate the decrypted vault structure', () => {
    const valid = { acc: [{ userid: 'u', password: 'p', notes: '' }] };
    expect(validateVaultData(valid)).toBe(valid);
    expect(() => validateVaultData([])).toThrow('Invalid vault data.');
    expect(() => validateVaultData({ acc: {} })).toThrow('Invalid vault data.');
    expect(() => validateVaultData({ acc: [{ userid: 'u', password: 'p' }] })).toThrow('Invalid vault data.');
    expect(() => validateVaultData(JSON.parse('{"__proto__":[]}'))).toThrow('Invalid vault data.');
  });

  test('should not migrate malformed legacy data', () => {
    const key = 'key';
    const malformed = { acc: [{ userid: 'u', password: 'p' }] };
    const encrypted = encryptLegacy(Buffer.from(JSON.stringify(malformed)), key);
    jest.spyOn(config, 'getVaultData').mockReturnValue(encrypted.toString('base64'));
    const setVaultData = jest.spyOn(config, 'setVaultData').mockImplementation(() => {});

    expect(() => open(key)).toThrow('Vault locked!');
    expect(setVaultData).not.toHaveBeenCalled();
    jest.restoreAllMocks();
  });
});
