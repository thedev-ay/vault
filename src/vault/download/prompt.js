const inquirer = require("inquirer");
const prompt = inquirer.prompt || (inquirer.default && inquirer.default.prompt);
const display = require("../../tools/display");
const { download } = require("./index");
const questions = require("../../config/questions");

module.exports.exportPrompt = async function() {
  try {
    const { secret } = await prompt(questions.default);
    display.banner();
    download(secret);
  } catch (err) {
    display.error(err.message || String(err));
  }
};