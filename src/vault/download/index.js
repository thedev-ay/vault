const config = require("../../tools/config");
const { open } = require("../common/index");
const fs = require("fs");

const download = (key) => {
  open(key);

  const buffer = config.getVaultData();
  const uniqueId = Math.floor(new Date() / 1000);
  const filename = `vault_${uniqueId}.vlt.enc`;
  const os = require("os");
  const vaultDir = `${process.env.TMP || os.tmpdir()}/Vault`;

  if (!fs.existsSync(vaultDir)){
    fs.mkdirSync(vaultDir);
  }

  fs.writeFileSync(`${vaultDir}/${filename}`, buffer, {encoding: "base64"});

  console.log("Link to file:", `${vaultDir}/${filename}`);
};

module.exports = {
  download,
};