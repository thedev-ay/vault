const config = require("../../tools/config");
const { open } = require("../common/index");
const fs = require("fs");
const crypto = require("crypto");
const os = require("os");
const path = require("path");

const writeExport = (buffer) => {
  const vaultDir = fs.mkdtempSync(path.join(os.tmpdir(), "Vault-"));
  const filename = `vault_${crypto.randomUUID()}.vlt.enc`;
  const filePath = path.join(vaultDir, filename);

  if (process.platform !== "win32") fs.chmodSync(vaultDir, 0o700);
  fs.writeFileSync(filePath, buffer, {
    flag: "wx",
    mode: 0o600
  });
  if (process.platform !== "win32") fs.chmodSync(filePath, 0o600);

  console.log("Link to file:", filePath);
  return filePath;
};

const download = (key) => {
  open(key);
  return writeExport(Buffer.from(config.getVaultData(), "base64"));
};

module.exports = {
  download,
  writeExport
};
