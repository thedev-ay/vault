const figlet = require("figlet");
const clear = require("clear");
const chalk = require("chalk");
const chalkTable = require("chalk-table");
const config = require("./config");
const packageJson = require("../../package.json");

const banner = () => {
  clear();

  console.log(
    chalk.hex(config.getBannerColor())(
      figlet.textSync(packageJson.name.toUpperCase(), { horizontalLayout: "full" })
    )
  );
};

const credentials = (credentials) => {
  const options = {
    leftPad: 2,
    columns: [
      { field: "account",  name: chalk.cyan("Account") },
      { field: "userid",  name: chalk.cyan("UserId") },
      { field: "password", name: chalk.magenta("Password") },
      { field: "notes", name: chalk.green("Notes") }
    ]
  };
      
  const table = chalkTable(options, credentials);
      
  console.log(table);
};

const accounts = (accounts) => {
  const options = {
    leftPad: 2,
    columns: [
      { field: "account",  name: chalk.cyan("Account") },
    ]
  };
      
  const table = chalkTable(options, accounts);
      
  console.log(table);
};

const error = (errMessage) => {
  console.log(chalk.red(errMessage));
};


module.exports = {
  banner,
  accounts,
  credentials,
  error,
};