const crypto = require("../../tools/crypto");
const config = require("../../tools/config");
const fs = require("fs");

const init = (key, data = {}, isEncrypted = false) => {
  let encryptedData;

  if (isEncrypted) {
    encryptedData = data;
  } else {
    const encrypted = crypto.encrypt(JSON.stringify(data), key);
    encryptedData = encrypted.toString("base64");    
  }

  const isDataExist = config.getVaultData();

  return { encrypted: encryptedData, isDataExist } ;
};

const initWithFile = (key, file) => {
  var data = fs.readFileSync(file, { encoding: "base64"});

  return init(key, data, true);
};

const initConfirm = (encrypted) => {
  config.setVaultData(encrypted);

  console.log("Vault initialized!");
};

// var fileData = fs.readFileSync('vault_1587298112.enc', { encoding : "base64" });
module.exports = {
  init,
  initWithFile,
  initConfirm
};