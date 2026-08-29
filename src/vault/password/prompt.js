const inquirer = require("inquirer");
const prompt = inquirer.prompt || (inquirer.default && inquirer.default.prompt);
const display = require("../../tools/display");
const questions = require("../../config/questions");
const session = require("../../tools/session");
const { ensureUnlocked } = require("../common/prompt");

module.exports.passwordPrompt = async function() {
  try {
    await ensureUnlocked();
    const { newSecret, newSecretConfirmation } = await prompt(questions.changePassword);
    if (newSecret !== newSecretConfirmation) throw new Error("Passwords do not match.");
    await session.execute("password", { newSecret });
    await session.stop();
    display.banner();
    console.log("Vault password changed. Vault locked!");
  } catch (err) {
    display.error(err.message || String(err));
  }
};
