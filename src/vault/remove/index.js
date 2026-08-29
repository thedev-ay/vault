const service = require("../../application/vault-service");

const remove = (key, accountName, userId) => {
  const result = service.removeByUserId(key, accountName, userId);
  console.log("Credentials removed!");
  return result;
};

const filterCredentials = (account, userId) => {
  return account.filter(x => x.userid !== userId);
};

module.exports = {
  remove,
  filterCredentials
};
