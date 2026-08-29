const crypto = require("../../tools/crypto");
const config = require("../../tools/config");
const { open } = require("../common/index");

const changePassword = (currentSecret, newSecret) => {
  if (currentSecret === newSecret) throw new Error("New vault password must be different.");

  const accounts = open(currentSecret);
  const encrypted = crypto.encrypt(Buffer.from(JSON.stringify(accounts)), newSecret);
  config.setVaultData(encrypted.toString("base64"));
};

module.exports = {
  changePassword
};
