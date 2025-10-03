const inquirer = require("inquirer");
const prompt = inquirer.prompt || (inquirer.default && inquirer.default.prompt);
const display = require("../../tools/display");
const { init, initWithFile, initConfirm } = require("./index");
const questions = require("../../config/questions");
const _initConfirm = questions.initConfirm;

module.exports.initPrompt = async function(file) {
  try {
    let result;
    if (file) {
      result = initWithFile(undefined, file);
    } else {
      const { secret } = await prompt(questions.default);
      display.banner();
      result = init(secret);
    }
    if (result.isDataExist) {
      const { proceed } = await prompt(_initConfirm);
      display.banner();
      if (proceed) {
        initConfirm(result.encrypted);
      }
    } else {
      initConfirm(result.encrypted);
    }
  } catch (err) {
    display.error(err.message || String(err));
  }
};