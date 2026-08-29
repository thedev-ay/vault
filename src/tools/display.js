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

const credentials = (credentials, renderOptions = {}) => {
  const tableOptions = {
    leftPad: 2,
    columns: [
      { field: "account",  name: chalk.cyan("Account") },
      { field: "userid",  name: chalk.cyan("UserId") },
      { field: "password", name: chalk.magenta("Password") },
      { field: "notes", name: chalk.green("Notes") }
    ]
  };
      
  const rows = credentials.map((credential) => ({
    ...credential,
    password: renderOptions.reveal ? credential.password : "••••••••"
  }));
  const table = chalkTable(tableOptions, rows);
      
  console.log(table);
};

const accounts = (accounts) => {
  const options = {
    leftPad: 2,
    columns: [
      { field: "account",  name: chalk.cyan("Account") },
      { field: "credentials", name: chalk.cyan("Credentials") },
    ]
  };
      
  const table = chalkTable(options, accounts);
      
  console.log(table);
};

const error = (errMessage) => {
  console.error(chalk.red(errMessage));
  process.exitCode = 1;
};


module.exports = {
  banner,
  accounts,
  credentials,
  error,
};
