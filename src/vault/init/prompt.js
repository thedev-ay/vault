const inquirer = require("inquirer");
const prompt = inquirer.prompt || (inquirer.default && inquirer.default.prompt);
const display = require("../../tools/display");
const { init, initWithFile, initConfirm } = require("./index");
const questions = require("../../config/questions");
const config = require("../../tools/config");
const session = require("../../tools/session");
const { ensureUnlocked } = require("../common/prompt");
const repository = require("../../infrastructure/vault-repository");
const _initConfirm = questions.initConfirm;

module.exports.initPrompt = async function(file) {
  try {
    if (config.getVaultData()) await ensureUnlocked();

    let result;
    if (file) {
      result = initWithFile(undefined, file);
      const { secret } = await prompt(questions.default);
      repository.parseEncrypted(result.encrypted, secret);
    } else {
      const { secret, secretConfirmation } = await prompt(questions.init);
      if (secret !== secretConfirmation) throw new Error("Passwords do not match.");
      display.banner();
      result = init(secret);
    }
    if (result.isDataExist) {
      const { proceed } = await prompt(_initConfirm);
      display.banner();
      if (proceed) {
        initConfirm(result.encrypted);
        await session.stop();
      }
    } else {
      initConfirm(result.encrypted);
    }
  } catch (err) {
    display.error(err.message || String(err));
  }
};
