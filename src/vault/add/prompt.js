const inquirer = require("inquirer");
const prompt = inquirer.prompt || (inquirer.default && inquirer.default.prompt);
const display = require("../../tools/display");
const { add } = require("./index");
const questions = require("../../config/questions");
const _add = questions.add;

module.exports.addPrompt = async function(account, opts = {}) {
  try {
    let answers;
    if (opts.noPrompt && process.env.NODE_ENV === "test") {
      answers = opts;
    } else {
      answers = await prompt(_add);
    }
    display.banner();
    add(answers.secret, account, {
      userid: answers.userid,
      password: answers.password,
      notes: answers.notes
    });
    if (opts.noPrompt && process.env.NODE_ENV === "test") process.exit(0);
  } catch (err) {
    display.error(err.message || String(err));
  }
};