const inquirer = require("inquirer");
const prompt = inquirer.prompt || (inquirer.default && inquirer.default.prompt);
const display = require("../../tools/display");
const { list } = require("./index");
const questions = require("../../config/questions");

module.exports.listPrompt = async function(opts = {}) {
  try {
    let secret;
    if (opts.noPrompt && process.env.NODE_ENV === "test") {
      secret = opts.secret;
    } else {
      secret = (await prompt(questions.default)).secret;
    }
    display.banner();
    list(secret);
    if (opts.noPrompt && process.env.NODE_ENV === "test") process.exit(0);
  } catch (err) {
    display.error(err.message || String(err));
  }
};