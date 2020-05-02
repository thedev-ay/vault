const inquirer = require("inquirer");
const display = require("../../tools/display");
const { list } = require("./index");
const questions = require("../../config/questions");

module.exports = async () => {
  try {
    const { secret } = await inquirer.prompt(questions.default);
    display.banner();

    list(secret);
  } catch (err) {        
    display.error(err.message);
  }
};