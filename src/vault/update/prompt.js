const inquirer = require("inquirer");
const prompt = inquirer.prompt || (inquirer.default && inquirer.default.prompt);
const display = require("../../tools/display");
const { update } = require("./index");
const questions = require("../../config/questions");

module.exports.updatePrompt = async function(account, opts = {}) {
  try {
    let answers;
    if (opts.noPrompt && process.env.NODE_ENV === "test") {
      // Use all provided options, bypass all prompts
      answers = {
        secret: opts.secret,
        userid: opts.userid,
        password: opts.password,
        notes: opts.notes
      };
    } else {
      answers = await prompt(questions.update);
    }
    display.banner();
    update(answers.secret, account, {
      userid: answers.userid,
      password: answers.password,
      notes: answers.notes
    });
    if (opts.noPrompt && process.env.NODE_ENV === "test") process.exit(0);
  } catch (err) {
    display.error(err.message || String(err));
  }
};