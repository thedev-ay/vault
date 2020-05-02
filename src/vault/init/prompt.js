const inquirer = require("inquirer");
const display = require("../../tools/display");
const { init, initWithFile, initConfirm } = require("./index");
const questions = require("../../config/questions");

module.exports = async (file) => {  
  try {
    let result;
    if (file) {
      result = initWithFile(undefined, file);
    } else {
      const { secret } = await inquirer.prompt(questions.default);
      display.banner();

      result = init(secret);
    }

    if (result.isDataExist) {
      const { proceed } = await inquirer.prompt(questions.initConfirm);
      display.banner();

      if (proceed) {                  
        initConfirm(result.encrypted);
      }
    } else {
      initConfirm(result.encrypted);
    }
  } catch (err) {        
    display.error(err.message);
  }
};