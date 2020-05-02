const display = require("../../tools/display");
const { open } = require("../common/index");

const list = (key) => {
  const accounts = open(key);
  
  const accountKeys = Object.keys(accounts);
  const accountsList = accountKeys.map((account) => ({ account }));

  display.accounts(accountsList);
};

module.exports = {
  list,
};