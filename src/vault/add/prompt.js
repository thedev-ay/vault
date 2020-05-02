const inquirer = require("inquirer");
const display = require("../../tools/display");
const { add } = require("./index");
const questions = require("../../config/questions");

module.exports = async (account) => {
  try {    
    const answers = await inquirer.prompt(questions.add);
    display.banner();

    add(answers.secret, account, 
      { userid: answers.userid, password: answers.password, notes: answers.notes }
    );
  } catch (err) {        
    display.error(err.message);
  }
};