const inquirer = require("inquirer");
const prompt = inquirer.prompt || (inquirer.default && inquirer.default.prompt);
const display = require("../../tools/display");
const { remove } = require("./index");
const questions = require("../../config/questions");

module.exports.removePrompt = async function(account, opts = {}) {
  try {
    let answers;
    if (opts.noPrompt && process.env.NODE_ENV === "test") {
      answers = opts;
    } else {
      answers = await prompt(questions.remove);
    }
    display.banner();
    remove(answers.secret, account, answers.userid);
    if (opts.noPrompt && process.env.NODE_ENV === "test") process.exit(0);
  } catch (err) {
    display.error(err.message || String(err));
  }
};