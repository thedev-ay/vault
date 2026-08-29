const crypto = require("crypto");
const {
  AccountNotFoundError,
  CorruptVaultError,
  CredentialNotFoundError
} = require("./errors");

const SCHEMA_VERSION = 1;
const RESERVED_ACCOUNT_NAMES = new Set(["__proto__", "constructor", "prototype"]);

const isText = (value) => typeof value === "string";
const now = () => new Date().toISOString();

const validateCredential = (credential) => {
  const valid = credential && typeof credential === "object" && !Array.isArray(credential) &&
    isText(credential.id) && credential.id !== "" &&
    isText(credential.account) && credential.account.trim() !== "" &&
    !RESERVED_ACCOUNT_NAMES.has(credential.account) &&
    isText(credential.userid) && credential.userid.trim() !== "" &&
    isText(credential.password) && credential.password !== "" &&
    isText(credential.notes) &&
    isText(credential.createdAt) && isText(credential.updatedAt);
  if (!valid) throw new CorruptVaultError();
  return credential;
};

const validateVault = (vault) => {
  if (!vault || typeof vault !== "object" || Array.isArray(vault) ||
      vault.schemaVersion !== SCHEMA_VERSION || !Array.isArray(vault.credentials)) {
    throw new CorruptVaultError();
  }
  const ids = new Set();
  for (const credential of vault.credentials) {
    validateCredential(credential);
    if (ids.has(credential.id)) throw new CorruptVaultError();
    ids.add(credential.id);
  }
  return vault;
};

const validateLegacyVault = (accounts) => {
  if (!accounts || typeof accounts !== "object" || Array.isArray(accounts)) {
    throw new CorruptVaultError();
  }
  for (const [account, credentials] of Object.entries(accounts)) {
    if (account.trim() === "" || RESERVED_ACCOUNT_NAMES.has(account) || !Array.isArray(credentials)) {
      throw new CorruptVaultError();
    }
    for (const credential of credentials) {
      const valid = credential && typeof credential === "object" && !Array.isArray(credential) &&
        isText(credential.userid) && credential.userid.trim() !== "" &&
        isText(credential.password) && credential.password !== "" &&
        isText(credential.notes);
      if (!valid) throw new CorruptVaultError();
    }
  }
  return accounts;
};

const fromLegacy = (accounts) => {
  validateLegacyVault(accounts);
  const timestamp = now();
  return {
    schemaVersion: SCHEMA_VERSION,
    credentials: Object.entries(accounts).flatMap(([account, credentials]) => credentials.map((credential) => ({
      id: crypto.randomUUID(),
      account,
      userid: credential.userid,
      password: credential.password,
      notes: credential.notes,
      createdAt: timestamp,
      updatedAt: timestamp
    })))
  };
};

const decode = (value) => {
  if (value && value.schemaVersion === SCHEMA_VERSION) {
    return { vault: validateVault(value), migrated: false };
  }
  return { vault: fromLegacy(value), migrated: true };
};

const empty = () => ({ schemaVersion: SCHEMA_VERSION, credentials: [] });

const accountCredentials = (vault, account) => {
  const matches = vault.credentials.filter((credential) => credential.account === account);
  if (matches.length === 0) throw new AccountNotFoundError();
  return matches;
};

const findCredential = (vault, id) => {
  const credential = vault.credentials.find((item) => item.id === id);
  if (!credential) throw new CredentialNotFoundError();
  return credential;
};

const addCredential = (vault, input) => {
  const account = input.account.trim();
  const userid = input.userid.trim();
  if (!account || RESERVED_ACCOUNT_NAMES.has(account) || !userid || !input.password) {
    throw new Error("Account, user ID, and password are required.");
  }
  if (vault.credentials.some((item) => item.account === account && item.userid === userid)) {
    throw new Error("User ID already exists!");
  }
  const timestamp = now();
  const credential = {
    id: crypto.randomUUID(),
    account,
    userid,
    password: input.password,
    notes: input.notes || "",
    createdAt: timestamp,
    updatedAt: timestamp
  };
  vault.credentials.push(credential);
  return credential;
};

const updateCredential = (vault, id, changes) => {
  const credential = findCredential(vault, id);
  if (changes.account !== undefined) credential.account = changes.account.trim();
  if (changes.userid !== undefined) credential.userid = changes.userid.trim();
  if (changes.password !== undefined) credential.password = changes.password;
  if (changes.notes !== undefined) credential.notes = changes.notes;
  if (!credential.account || RESERVED_ACCOUNT_NAMES.has(credential.account) || !credential.userid || !credential.password) {
    throw new Error("Account, user ID, and password are required.");
  }
  if (vault.credentials.some((item) => item.id !== id && item.account === credential.account && item.userid === credential.userid)) {
    throw new Error("User ID already exists!");
  }
  credential.updatedAt = now();
  return credential;
};

const removeCredential = (vault, id) => {
  const index = vault.credentials.findIndex((item) => item.id === id);
  if (index === -1) throw new CredentialNotFoundError();
  return vault.credentials.splice(index, 1)[0];
};

const toLegacyAccounts = (vault) => vault.credentials.reduce((accounts, credential) => {
  if (!Object.prototype.hasOwnProperty.call(accounts, credential.account)) accounts[credential.account] = [];
  accounts[credential.account].push({
    userid: credential.userid,
    password: credential.password,
    notes: credential.notes
  });
  return accounts;
}, Object.create(null));

module.exports = {
  SCHEMA_VERSION,
  empty,
  decode,
  validateVault,
  validateLegacyVault,
  accountCredentials,
  findCredential,
  addCredential,
  updateCredential,
  removeCredential,
  toLegacyAccounts
};
