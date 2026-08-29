"use strict";

const program = require("commander");
const display = require("./tools/display");
const config = require("./tools/config");
const prompt = require("./vault/index");
const session = require("./tools/session");

if (session.isAgentProcess()) {
  session.runAgent();
} else {
  config.setBannerColor();

  display.banner();



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
    .description("List accounts available")
    .action(() => {
      prompt.list();
    });

  program
    .command("show")
    .arguments("[account]")
    .description("Get credentials")
    .action((account) => {
      prompt.show(account);
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

  program.parse(process.argv);
}
