const inquirer = require("inquirer");
const prompt = inquirer.prompt || (inquirer.default && inquirer.default.prompt);
const questions = require("../../config/questions");
const config = require("../../tools/config");
const session = require("../../tools/session");
const service = require("../../application/vault-service");

const ensureUnlocked = async () => {
  if (await session.isUnlocked()) return true;
  if (!config.getVaultData()) throw new Error("Vault is not initialized. Run `vault init` first.");

  const { proceed } = await prompt(questions.unlockConfirm);
  if (!proceed) throw new Error("Vault remains locked.");

  const answers = await prompt(questions.default);
  let secret = answers.secret;
  try {
    service.migrate(secret);
    await session.start(secret, session.DEFAULT_MINUTES);
  } finally {
    secret = undefined;
    answers.secret = undefined;
  }
  return true;
};

const executeUnlocked = async (action, payload) => {
  await ensureUnlocked();
  return session.execute(action, payload);
};

const promptWithUnlockedSession = async (questionSet, beforePrompt) => {
  await ensureUnlocked();
  if (beforePrompt) await beforePrompt();
  return prompt(questionSet.filter((question) => question.name !== "secret"));
};

module.exports = {
  ensureUnlocked,
  executeUnlocked,
  promptWithUnlockedSession
};
