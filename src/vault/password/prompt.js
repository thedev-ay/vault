const inquirer = require("inquirer");
const prompt = inquirer.prompt || (inquirer.default && inquirer.default.prompt);
const display = require("../../tools/display");
const questions = require("../../config/questions");
const session = require("../../tools/session");
const { getUnlockedSecret } = require("../common/prompt");
const { changePassword } = require("./index");

module.exports.passwordPrompt = async function() {
  try {
    const currentSecret = await getUnlockedSecret();
    const { newSecret } = await prompt(questions.changePassword);
    changePassword(currentSecret, newSecret);
    await session.stop();
    display.banner();
    console.log("Vault password changed. Vault locked!");
  } catch (err) {
    display.error(err.message || String(err));
  }
};
