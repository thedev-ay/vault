const display = require("../../tools/display");
const session = require("../../tools/session");

module.exports.lock = async function() {
  try {
    const wasUnlocked = await session.stop();
    display.banner();
    console.log(wasUnlocked ? "Vault locked!" : "Vault is already locked.");
  } catch (err) {
    display.error(err.message || String(err));
  }
};
