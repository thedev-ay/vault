const crypto = require("../../tools/crypto");
const config = require("../../tools/config");

const open = (key) => {
  try {        
    const decrypted = crypto.decrypt(
      Buffer.from(config.getVaultData(), "base64"), key);

    return JSON.parse(decrypted.toString());
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
};