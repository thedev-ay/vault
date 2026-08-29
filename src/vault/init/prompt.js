const inquirer = require("inquirer");
const prompt = inquirer.prompt || (inquirer.default && inquirer.default.prompt);
const display = require("../../tools/display");
const { init, initWithFile, initConfirm } = require("./index");
const questions = require("../../config/questions");
const config = require("../../tools/config");
const session = require("../../tools/session");
const { getUnlockedSecret } = require("../common/prompt");
const _initConfirm = questions.initConfirm;

module.exports.initPrompt = async function(file) {
  try {
    if (config.getVaultData() && !(await session.getSecret())) await getUnlockedSecret();

    let result;
    if (file) {
      result = initWithFile(undefined, file);
    } else {
      const { secret } = await prompt(questions.init);
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
