const inquirer = require("inquirer");
const prompt = inquirer.prompt || (inquirer.default && inquirer.default.prompt);
const questions = require("../../config/questions");
const config = require("../../tools/config");
const session = require("../../tools/session");
const { open } = require("./index");

const getUnlockedSecret = async () => {
  const unlockedSecret = await session.getSecret();
  if (unlockedSecret) return unlockedSecret;
  if (!config.getVaultData()) throw new Error("Vault is not initialized. Run `vault init` first.");

  const { proceed } = await prompt(questions.unlockConfirm);
  if (!proceed) throw new Error("Vault remains locked.");

  const { secret } = await prompt(questions.default);
  open(secret);
  await session.start(secret, session.DEFAULT_MINUTES);
  return secret;
};

const promptWithUnlockedSecret = async (questionSet, beforePrompt) => {
  const unlockedSecret = await getUnlockedSecret();
  if (beforePrompt) await beforePrompt(unlockedSecret);
  const answers = await prompt(questionSet.filter((question) => question.name !== "secret"));
  return { secret: unlockedSecret, ...answers };
};

module.exports = {
  getUnlockedSecret,
  promptWithUnlockedSecret
};
