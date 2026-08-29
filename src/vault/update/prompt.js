const display = require("../../tools/display");
const { update } = require("./index");
const questions = require("../../config/questions");
const { promptWithUnlockedSecret } = require("../common/prompt");
const { open, getAccountCredentials } = require("../common/index");

module.exports.updatePrompt = async function(account, opts = {}) {
  try {
    let answers;
    if (opts.noPrompt && process.env.NODE_ENV === "test") {
      // Use all provided options, bypass all prompts
      answers = {
        secret: opts.secret,
        userid: opts.userid,
        password: opts.password,
        notes: opts.notes
      };
    } else {
      answers = await promptWithUnlockedSecret(questions.update, (secret) => {
        getAccountCredentials(open(secret), account);
      });
    }
    display.banner();
    update(answers.secret, account, {
      userid: answers.userid,
      password: answers.password,
      notes: answers.notes
    });
    if (opts.noPrompt && process.env.NODE_ENV === "test") process.exit(0);
  } catch (err) {
    display.error(err.message || String(err));
  }
};
