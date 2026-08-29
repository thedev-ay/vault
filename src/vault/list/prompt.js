const display = require("../../tools/display");
const session = require("../../tools/session");
const { ensureUnlocked } = require("../common/prompt");

module.exports.listPrompt = async function(opts = {}) {
  try {
    await ensureUnlocked();
    const accounts = await session.execute("list");
    if (opts.json) console.log(JSON.stringify(accounts, null, 2));
    else {
      display.banner();
      display.accounts(accounts);
    }
  } catch (err) {
    display.error(err.message || String(err));
  }
};
