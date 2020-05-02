const crypto = require("../../tools/crypto");
const config = require("../../tools/config");
const { open } = require("../common/index");

const add = (key, accountName, credentials) => {
  const accounts = open(key);
  let account = accounts[accountName];

  if (!account) {
    accounts[accountName] = [credentials];
  } else {
    checkExistingCredentials(account, credentials);
    accounts[accountName].push(credentials);
  }

  const encrypted = crypto.encrypt(JSON.stringify(accounts), key);
  const bufferedEncrypted = encrypted.toString("base64");

  config.setVaultData(bufferedEncrypted);

  console.log("Credentials added!");
};

const checkExistingCredentials = (account, credentials) => {
  const data = account.find(x => x.userid === credentials.userid);  

  if (data) {
    throw new Error("User ID already exists!");
  }
};

module.exports = {
  add,
};