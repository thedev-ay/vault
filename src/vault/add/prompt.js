const display = require("../../tools/display");
const questions = require("../../config/questions");
const session = require("../../tools/session");
const { promptWithUnlockedSession } = require("../common/prompt");
const _add = questions.add;

module.exports.addPrompt = async function(account) {
  try {
    const answers = await promptWithUnlockedSession(_add);
    display.banner();
    await session.execute("add", {
      account,
      userid: answers.userid,
      password: answers.password,
      notes: answers.notes
    });
    console.log("Credentials added!");
  } catch (err) {
    display.error(err.message || String(err));
  }
};
