const inquirer = require("inquirer");
const prompt = inquirer.prompt || (inquirer.default && inquirer.default.prompt);
const display = require("../../tools/display");
const questions = require("../../config/questions");
const service = require("../../application/vault-service");
const session = require("../../tools/session");

module.exports.unlockPrompt = async function(minutes) {
  try {
    const duration = session.validateMinutes(minutes);
    const answers = await prompt(questions.default);
    let secret = answers.secret;
    let expiresAt;
    try {
      service.migrate(secret);
      expiresAt = await session.start(secret, duration);
    } finally {
      secret = undefined;
      answers.secret = undefined;
    }
    display.banner();
    console.log(`Vault unlocked until ${new Date(expiresAt).toLocaleTimeString()}.`);
  } catch (err) {
    display.error(err.message || String(err));
  }
};
