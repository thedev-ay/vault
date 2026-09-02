const inquirer = require("inquirer");
const prompt = inquirer.prompt || (inquirer.default && inquirer.default.prompt);
const packageJson = require("../../../package.json");
const config = require("../../tools/config");
const display = require("../../tools/display");
const session = require("../../tools/session");
const updater = require("../../tools/system-update");

module.exports.systemUpdatePrompt = async function(options = {}) {
  try {
    const release = await updater.check(packageJson.version);
    if (!release.updateAvailable) {
      console.log(`Vault ${packageJson.version} is already up to date.`);
      return;
    }

    console.log(`Vault ${release.version} is available (installed: ${packageJson.version}).`);
    if (options.check) return;

    let proceed = Boolean(options.yes);
    if (!proceed) {
      const answer = await prompt([{
        type: "confirm",
        name: "proceed",
        default: false,
        message: "Download, verify, and install this system update?"
      }]);
      proceed = answer.proceed;
    }
    if (!proceed) {
      console.log("Update cancelled.");
      return;
    }

    console.log("Downloading and verifying the update…");
    const prepared = await updater.prepare(release);
    await session.stop();
    updater.install(prepared);
    display.banner();
    console.log(`Vault ${release.version} installed successfully.`);
    console.log(`Encrypted vault data was left unchanged at ${config.getVaultPath()}.`);
    console.log("The vault is locked. Run `vault unlock` to apply any compatible data migrations.");
  } catch (err) {
    display.error(err.message || String(err));
  }
};
