const inquirer = require("inquirer");
const prompt = inquirer.prompt || (inquirer.default && inquirer.default.prompt);
const display = require("../../tools/display");
const session = require("../../tools/session");
const { ensureUnlocked } = require("../common/prompt");

const nonEmpty = (value) => value.trim() !== "" || "Cannot be empty.";

module.exports.updatePrompt = async function(account) {
  try {
    await ensureUnlocked();
    const credentials = await session.execute("credentials", { account, reveal: false });
    const selected = await prompt([{
      type: "list",
      name: "id",
      message: "Select credentials to update:",
      choices: credentials.map((credential) => ({ name: credential.userid, value: credential.id }))
    }]);
    const current = credentials.find((credential) => credential.id === selected.id);
    const answers = await prompt([
      { name: "account", message: "Account:", default: current.account, validate: nonEmpty, filter: (value) => value.trim() },
      { name: "userid", message: "User ID/email:", default: current.userid, validate: nonEmpty, filter: (value) => value.trim() },
      { type: "confirm", name: "updatePassword", default: false, message: "Update password?" },
      { type: "password", name: "password", mask: true, message: "Enter password:", validate: nonEmpty, when: (value) => value.updatePassword },
      { type: "confirm", name: "updateNotes", default: false, message: "Update notes?" },
      { name: "notes", message: "Notes:", default: current.notes, when: (value) => value.updateNotes }
    ]);
    const changes = { account: answers.account, userid: answers.userid };
    if (answers.updatePassword) changes.password = answers.password;
    if (answers.updateNotes) changes.notes = answers.notes;
    await session.execute("update", { id: selected.id, changes });
    display.banner();
    console.log("Credentials updated!");
  } catch (err) {
    display.error(err.message || String(err));
  }
};
