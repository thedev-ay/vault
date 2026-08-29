const display = require("../../tools/display");
const { list } = require("./index");
const { getUnlockedSecret } = require("../common/prompt");

module.exports.listPrompt = async function(opts = {}) {
  try {
    let secret;
    if (opts.noPrompt && process.env.NODE_ENV === "test") {
      secret = opts.secret;
    } else {
      secret = await getUnlockedSecret();
    }
    display.banner();
    list(secret);
  } catch (err) {
    display.error(err.message || String(err));
  }
};
