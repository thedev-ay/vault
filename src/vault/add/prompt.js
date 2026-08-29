const display = require("../../tools/display");
const { add } = require("./index");
const questions = require("../../config/questions");
const { promptWithUnlockedSecret } = require("../common/prompt");
const _add = questions.add;

module.exports.addPrompt = async function(account, opts = {}) {
  try {
    let answers;
    if (opts.noPrompt && process.env.NODE_ENV === "test") {
      answers = opts;
    } else {
      answers = await promptWithUnlockedSecret(_add);
    }
    display.banner();
    add(answers.secret, account, {
      userid: answers.userid,
      password: answers.password,
      notes: answers.notes
    });
    if (opts.noPrompt && process.env.NODE_ENV === "test") process.exit(0);
  } catch (err) {
    display.error(err.message || String(err));
  }
};
