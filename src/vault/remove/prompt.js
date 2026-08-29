const inquirer = require("inquirer");
const prompt = inquirer.prompt || (inquirer.default && inquirer.default.prompt);
const display = require("../../tools/display");
const session = require("../../tools/session");
const { ensureUnlocked } = require("../common/prompt");

module.exports.removePrompt = async function(account) {
  try {
    await ensureUnlocked();
    const credentials = await session.execute("credentials", { account, reveal: false });
    const answers = await prompt([
      {
        type: "list",
        name: "id",
        message: "Select credentials to remove:",
        choices: credentials.map((credential) => ({
          name: `${credential.userid}${credential.notes ? ` — ${credential.notes}` : ""}`,
          value: credential.id
        }))
      },
      {
        type: "confirm",
        name: "proceed",
        default: false,
        message: "Remove these credentials permanently?"
      }
    ]);
    display.banner();
    if (!answers.proceed) {
      console.log("Nothing removed.");
      return;
    }
    await session.execute("remove", { id: answers.id });
    console.log("Credentials removed!");
  } catch (err) {
    display.error(err.message || String(err));
  }
};
