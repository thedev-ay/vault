const inquirer = require("inquirer");
const prompt = inquirer.prompt || (inquirer.default && inquirer.default.prompt);
const clipboard = require("../../tools/clipboard");
const config = require("../../tools/config");
const display = require("../../tools/display");
const session = require("../../tools/session");
const { ensureUnlocked } = require("../common/prompt");

module.exports.copyPrompt = async function(account, options = {}) {
  try {
    const field = options.field || "password";
    if (!["password", "username"].includes(field)) {
      throw new Error("Copy field must be `password` or `username`.");
    }
    await ensureUnlocked();
    const credentials = await session.execute("credentials", { account, reveal: true });
    let credential = credentials[0];
    if (credentials.length > 1) {
      const answer = await prompt([{
        type: "list",
        name: "id",
        message: "Select credentials:",
        choices: credentials.map((item) => ({ name: item.userid, value: item.id }))
      }]);
      credential = credentials.find((item) => item.id === answer.id);
    }
    clipboard.copy(field === "username" ? credential.userid : credential.password, {
      clearSeconds: options.clearSeconds
    });
    display.banner();
    console.log(`${field === "username" ? "Username" : "Password"} copied. Clipboard clears in ${options.clearSeconds || clipboard.DEFAULT_CLEAR_SECONDS} seconds.`);
    if (!config.getClipboardWarningShown()) {
      console.log("Clipboard managers may retain copied values in their history.");
      config.setClipboardWarningShown();
    }
  } catch (err) {
    display.error(err.message || String(err));
  }
};
