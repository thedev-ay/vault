const inquirer = require("inquirer");
const prompt = inquirer.prompt || (inquirer.default && inquirer.default.prompt);
const display = require("../../tools/display");
const questions = require("../../config/questions");
const { open } = require("../common/index");
const session = require("../../tools/session");

module.exports.unlockPrompt = async function(minutes) {
  try {
    const duration = session.validateMinutes(minutes);
    const { secret } = await prompt(questions.default);
    open(secret);
    const expiresAt = await session.start(secret, duration);
    display.banner();
    console.log(`Vault unlocked until ${new Date(expiresAt).toLocaleTimeString()}.`);
  } catch (err) {
    display.error(err.message || String(err));
  }
};
