const crypto = require("../../tools/crypto");
const config = require("../../tools/config");
const { open, getAccountCredentials } = require("../common/index");

const update = (key, accountName, credentials) => {
  const accounts = open(key);
  const account = getAccountCredentials(accounts, accountName);

  const updatedList = findAndUpdateCredentials(account, credentials);
  
  accounts[accountName] = updatedList;
  
  const encrypted = crypto.encrypt(JSON.stringify(accounts), key);
  const bufferedEncrypted = encrypted.toString("base64");

  config.setVaultData(bufferedEncrypted);

  console.log("Credentials updated!");
};

const findAndUpdateCredentials = (account, credentials) => {
  let isFound = false;
  const updated = account.map(x => {
    if (x.userid === credentials.userid) {
      isFound = true;
      const updatedCredentials = { ...x };
      if (credentials.password !== undefined) {
        updatedCredentials.password = credentials.password;
      }

      if (credentials.notes !== undefined) {
        updatedCredentials.notes = credentials.notes;
      }
      return updatedCredentials;
    }
    return x;
  });

  if (!isFound) throw new Error("User ID not found!");
  return updated;
};

module.exports = {
  update,
};
