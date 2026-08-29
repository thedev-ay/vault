const service = require("../../application/vault-service");

const update = (key, accountName, credentials) => {
  const result = service.updateByUserId(key, accountName, credentials);
  console.log("Credentials updated!");
  return result;
};

module.exports = {
  update,
};
