const display = require("../../tools/display");
const { writeExport } = require("./index");
const session = require("../../tools/session");
const { ensureUnlocked } = require("../common/prompt");

module.exports.exportPrompt = async function() {
  try {
    await ensureUnlocked();
    const encoded = await session.execute("export");
    display.banner();
    writeExport(Buffer.from(encoded, "base64"));
  } catch (err) {
    display.error(err.message || String(err));
  }
};
