const display = require("../../tools/display");
const { download } = require("./index");
const { getUnlockedSecret } = require("../common/prompt");

module.exports.exportPrompt = async function() {
  try {
    const secret = await getUnlockedSecret();
    display.banner();
    download(secret);
  } catch (err) {
    display.error(err.message || String(err));
  }
};
