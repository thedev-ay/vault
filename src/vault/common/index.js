const crypto = require("../../tools/crypto");
const config = require("../../tools/config");

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
  try {
    const encrypted = Buffer.from(config.getVaultData(), "base64");
    const decrypted = crypto.decrypt(encrypted, key);
    const accounts = validateVaultData(JSON.parse(decrypted.toString()));

    if (crypto.needsUpgrade(encrypted)) {
      const upgraded = crypto.encrypt(Buffer.from(JSON.stringify(accounts)), key);
      config.setVaultData(upgraded.toString("base64"));
    }

    return accounts;
  } catch (err) {
    throw new Error("Vault locked!");
  }
};

const getCredentials = (accounts, query) => {
  let credentials = accounts[query];

  if (!credentials) {
    throw new Error("Account not found!");
  }

  credentials = credentials.map((credentials) => {
    credentials.account = query;
    return credentials;
  });

  return credentials;
};

const getAllCredentials = (accounts) => {
  let credentialsList = [];

  for (const [key, value] of Object.entries(accounts)) {
    value.forEach((credentials) => {
      credentials.account = key;
      credentialsList.push(credentials);
    });
  }
  
  return credentialsList;
};

module.exports = {
  open,
  getCredentials,
  getAllCredentials,
  validateVaultData,
};
