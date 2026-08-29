const service = require("../../application/vault-service");

const changePassword = (currentSecret, newSecret) => {
  return service.changePassword(currentSecret, newSecret);
};

module.exports = {
  changePassword
};
