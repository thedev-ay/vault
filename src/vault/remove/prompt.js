const inquirer = require("inquirer");
const display = require("../../tools/display");
const { remove } = require("./index");
const questions = require("../../config/questions");

module.exports = async (account) => {
  try {
    const answers = await inquirer.prompt(questions.remove);
    display.banner();

    remove(answers.secret, account, answers.userid);
  } catch (err) {        
    display.error(err.message);
  }
};