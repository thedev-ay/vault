const inquirer = require("inquirer");
const display = require("../../tools/display");
const { show } = require("./index");
const questions = require("../../config/questions");

module.exports = async (account) => {
  try {
    const { secret } = await inquirer.prompt(questions.default);
    display.banner();

    show(secret, account);
  } catch (err) {        
    display.error(err.message);
  }
};