const crypto = require("../../tools/crypto");
const config = require("../../tools/config");
const { open, getCredentials } = require("../common/index");

const update = (key, accountName, credentials) => {
  const accounts = open(key);
  const account = getCredentials(accounts, accountName);

  const updatedList = findAndUpdateCredentials(account, credentials);
  
  accounts[accountName] = updatedList;
  
  const encrypted = crypto.encrypt(JSON.stringify(accounts), key);
  const bufferedEncrypted = encrypted.toString("base64");

  config.setVaultData(bufferedEncrypted);

  console.log("Credentials updated!");
};

const findAndUpdateCredentials = (account, credentials) => {
  return account.map(x => {
    if (x.userid === credentials.userid) {
      if (credentials.password !== undefined) {
        x.password = credentials.password;
      }
      
      if (credentials.notes !== undefined) {
        x.notes = credentials.notes;
      }
    }
    return x;
  });
};

module.exports = {
  update,
};