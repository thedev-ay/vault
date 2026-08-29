const display = require("../../tools/display");
const { remove } = require("./index");
const questions = require("../../config/questions");
const { promptWithUnlockedSecret } = require("../common/prompt");
const { open, getAccountCredentials } = require("../common/index");

module.exports.removePrompt = async function(account, opts = {}) {
  try {
    let answers;
    if (opts.noPrompt && process.env.NODE_ENV === "test") {
      answers = opts;
    } else {
      answers = await promptWithUnlockedSecret(questions.remove, (secret) => {
        getAccountCredentials(open(secret), account);
      });
    }
    display.banner();
    remove(answers.secret, account, answers.userid);
  } catch (err) {
    display.error(err.message || String(err));
  }
};
