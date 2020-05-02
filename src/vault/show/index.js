const display = require("../../tools/display");
const { open, getCredentials, getAllCredentials } = require("../common/index");

const show = (key, accountName) => {
  let credentials;

  const accounts = open(key);

  if (accountName) {
    credentials = getCredentials(accounts, accountName);
  } else {
    credentials = getAllCredentials(accounts);
  }

  display.credentials(credentials);
};

module.exports = {
  show,
};