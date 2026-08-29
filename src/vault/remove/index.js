const crypto = require("../../tools/crypto");
const config = require("../../tools/config");
const { open, getAccountCredentials } = require("../common/index");

const remove = (key, accountName, userId) => {
  const accounts = open(key);
  const account = getAccountCredentials(accounts, accountName);
  if (!account.some(credentials => credentials.userid === userId)) {
    throw new Error("User ID not found!");
  }

  const updatedList = filterCredentials(account, userId);
  if (updatedList.length > 0) {
    accounts[accountName] = updatedList;
  } else {
    delete accounts[accountName];
  }
  
  const encrypted = crypto.encrypt(JSON.stringify(accounts), key);
  const bufferedEncrypted = encrypted.toString("base64");

  config.setVaultData(bufferedEncrypted);

  console.log("Credentials removed!");
};

const filterCredentials = (account, userId) => {
  return account.filter(x => x.userid !== userId);
};

module.exports = {
  remove,
};
