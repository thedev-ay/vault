"use strict";

const program = require("commander");
const display = require("./tools/display");
const config = require("./tools/config");
const prompt = require("./vault/index");
const session = require("./tools/session");
const clipboard = require("./tools/clipboard");

if (session.isAgentProcess()) {
  session.runAgent();
} else if (clipboard.isClearProcess()) {
  clipboard.runClearProcess();
} else {
  config.setBannerColor();
  if (!process.argv.includes("--json")) display.banner();



  program
    .command("init")
    .option("-f, --file <vlt.enc file>", "The vlt.enc file generated after exporting vault")
    .description("Create vault")
    .action((options) => {
      prompt.init(options.file);
    });

  program
    .command("add")
    .arguments("<account>")
    .description("Add credentials")
    .action((account) => {
      prompt.add(account);
    });

  program
    .command("list")
    .option("--json", "Print stable machine-readable JSON")
    .description("List accounts available")
    .action((options) => {
      prompt.list(options);
    });

  program
    .command("show")
    .arguments("[account]")
    .option("--reveal", "Reveal passwords in output")
    .option("--json", "Print stable machine-readable JSON")
    .description("Get credentials")
    .action((account, options) => {
      prompt.show(account, options);
    });

  program
    .command("copy")
    .arguments("<account>")
    .option("-f, --field <field>", "Field to copy: password or username", "password")
    .option("--clear-seconds <seconds>", "Seconds before clearing the unchanged clipboard", "45")
    .description("Copy a credential field without printing it")
    .action((account, options) => {
      const clearSeconds = Number(options.clearSeconds);
      if (!Number.isInteger(clearSeconds) || clearSeconds < 5 || clearSeconds > 300) {
        display.error("Clipboard clear time must be a whole number from 5 to 300 seconds.");
        return;
      }
      prompt.copy(account, { field: options.field, clearSeconds });
    });

  program
    .command("export")
    .description("Download all credentials")
    .action(() => {
      prompt.export();
    });

  program
    .command("remove")
    .arguments("<account>")
    .description("Remove credentials from account")
    .action((account) => {
      prompt.remove(account);
    });

  program
    .command("update")
    .arguments("<account>")
    .description("Update credentials")
    .action((account) => {
      prompt.update(account);
    });

  program
    .command("unlock")
    .option("-m, --minutes <minutes>", "Session duration in minutes", String(session.DEFAULT_MINUTES))
    .description("Unlock vault for a limited time")
    .action((options) => {
      prompt.unlock(options.minutes);
    });

  program
    .command("lock")
    .description("End the current unlock session")
    .action(() => {
      prompt.lock();
    });

  program
    .command("password")
    .description("Change the master vault password")
    .action(() => {
      prompt.password();
    });

  program.parse(process.argv);
}
