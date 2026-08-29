const domain = require("../../domain/vault");
const repository = require("../../infrastructure/vault-repository");

const RESERVED_ACCOUNT_NAMES = new Set(["__proto__", "constructor", "prototype"]);

const validateVaultData = (accounts) => {
  if (!accounts || typeof accounts !== "object" || Array.isArray(accounts)) {
    throw new Error("Invalid vault data.");
  }

  for (const [accountName, credentials] of Object.entries(accounts)) {
    if (accountName.trim() === "" || RESERVED_ACCOUNT_NAMES.has(accountName)) {
      throw new Error("Invalid vault data.");
    }
    if (!Array.isArray(credentials)) throw new Error("Invalid vault data.");

    for (const credential of credentials) {
      const isObject = credential && typeof credential === "object" && !Array.isArray(credential);
      if (!isObject ||
          typeof credential.userid !== "string" || credential.userid.trim() === "" ||
          typeof credential.password !== "string" || credential.password === "" ||
          typeof credential.notes !== "string") {
        throw new Error("Invalid vault data.");
      }
    }
  }

  return accounts;
};

const open = (key) => {
  return domain.toLegacyAccounts(repository.read(key).vault);
};

const getAccountCredentials = (accounts, query) => {
  const credentials = Object.prototype.hasOwnProperty.call(accounts, query) ? accounts[query] : undefined;

  if (!credentials) {
    throw new Error("Account not found!");
  }

  return credentials;
};

const getCredentials = (accounts, query) => {
  return getAccountCredentials(accounts, query).map((credentials) => ({
    ...credentials,
    account: query
  }));
};

const getAllCredentials = (accounts) => {
  let credentialsList = [];

  for (const [key, value] of Object.entries(accounts)) {
    value.forEach((credentials) => {
      credentialsList.push({
        ...credentials,
        account: key
      });
    });
  }
  
  return credentialsList;
};

module.exports = {
  open,
  getAccountCredentials,
  getCredentials,
  getAllCredentials,
  validateVaultData,
};
