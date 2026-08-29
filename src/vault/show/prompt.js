const display = require("../../tools/display");
const session = require("../../tools/session");
const { ensureUnlocked } = require("../common/prompt");

module.exports.showPrompt = async function(account, opts = {}) {
  try {
    await ensureUnlocked();
    const credentials = await session.execute("credentials", {
      account,
      reveal: Boolean(opts.reveal)
    });
    if (opts.json) {
      console.log(JSON.stringify(credentials.map((credential) => {
        if (opts.reveal) return credential;
        const safe = { ...credential };
        delete safe.password;
        return safe;
      }), null, 2));
    } else {
      display.banner();
      display.credentials(credentials, { reveal: Boolean(opts.reveal) });
      if (!opts.reveal) console.log("Passwords are hidden. Use --reveal to display them.");
    }
  } catch (err) {
    display.error(err.message || String(err));
  }
};
