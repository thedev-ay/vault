const config = require("../tools/config");
const vaultCrypto = require("../tools/crypto");
const vaultDomain = require("../domain/vault");
const {
  AuthenticationError,
  CorruptVaultError,
  VaultNotInitializedError,
  VaultStorageError
} = require("../domain/errors");

const parseEncrypted = (encoded, secret) => {
  if (!encoded) throw new VaultNotInitializedError();
  let decrypted;
  try {
    decrypted = typeof secret === "object"
      ? vaultCrypto.decryptWithSessionContext(Buffer.from(encoded, "base64"), secret)
      : vaultCrypto.decrypt(Buffer.from(encoded, "base64"), secret);
  } catch (err) {
    throw new AuthenticationError(err);
  }

  let value;
  try {
    value = JSON.parse(decrypted.toString("utf8"));
  } catch (err) {
    throw new CorruptVaultError(err);
  }
  return vaultDomain.decode(value);
};

const read = (secret) => {
  const encoded = config.getVaultData();
  const decoded = parseEncrypted(encoded, secret);
  return {
    ...decoded,
    cryptoUpgrade: vaultCrypto.needsUpgrade(Buffer.from(encoded, "base64")),
    storageUpgrade: config.hasLegacyVaultData ? config.hasLegacyVaultData() : false
  };
};

const encode = (vault, secret) => vaultCrypto[
  typeof secret === "object" ? "encryptWithSessionContext" : "encrypt"
](Buffer.from(JSON.stringify(vault)), secret)
  .toString("base64");

const write = (vault, secret, options = {}) => {
  vaultDomain.validateVault(vault);
  config.setVaultData(encode(vault, secret), options);
  return vault;
};

const migrate = (secret) => config.withVaultLock(() => {
  const result = read(secret);
  if (result.migrated || result.cryptoUpgrade || result.storageUpgrade) {
    write(result.vault, secret, { locked: true });
    return { vault: result.vault, migrated: true };
  }
  return { vault: result.vault, migrated: false };
});

const update = (secret, operation) => config.withVaultLock(() => {
  const { vault } = read(secret);
  const result = operation(vault);
  write(vault, secret, { locked: true });
  return result;
});

const rekey = (currentSecret, newSecret) => config.withVaultLock(() => {
  const { vault } = read(currentSecret);
  write(vault, newSecret, { locked: true });
  return vault;
});

const initialize = (secret) => {
  const vault = vaultDomain.empty();
  write(vault, secret);
  return vault;
};

const importEncrypted = (encoded) => {
  if (!encoded) throw new VaultStorageError("The selected vault file is empty.");
  config.setVaultData(encoded);
};

const exportEncrypted = (secret) => {
  read(secret);
  return Buffer.from(config.getVaultData(), "base64");
};

module.exports = {
  read,
  write,
  migrate,
  update,
  rekey,
  initialize,
  importEncrypted,
  exportEncrypted,
  parseEncrypted
};
