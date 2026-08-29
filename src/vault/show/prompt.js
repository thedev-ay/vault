const display = require("../../tools/display");
const { show } = require("./index");
const { getUnlockedSecret } = require("../common/prompt");

module.exports.showPrompt = async function(account, opts = {}) {
  try {
    let secret;
    if (opts.noPrompt && process.env.NODE_ENV === "test") {
      secret = opts.secret;
    } else {
      secret = await getUnlockedSecret();
    }
    display.banner();
    show(secret, account);
  } catch (err) {
    display.error(err.message || String(err));
  }
};
