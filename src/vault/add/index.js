const service = require("../../application/vault-service");

const add = (key, accountName, credentials) => {
  const result = service.addCredential(key, { account: accountName, ...credentials });
  console.log("Credentials added!");
  return result;
};

const checkExistingCredentials = (account, credentials) => {
  const data = account.find(x => x.userid === credentials.userid);  

  if (data) {
    throw new Error("User ID already exists!");
  }
};

module.exports = {
  add,
  checkExistingCredentials
};
