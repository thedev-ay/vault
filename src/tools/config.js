const Configstore = require("configstore");
const packageJson = require("../../package.json");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const { VaultBusyError, VaultStorageError } = require("../domain/errors");

const getConfigName = () => {
  const environment = process.env.NODE_ENV;
  let configName = `${packageJson.name}-dev`;

  if (environment === "production") {
    configName = `${packageJson.name}-prod`;
  }

  return configName;
};

const configName = getConfigName();
const config = new Configstore(configName);
const vaultPath = path.join(path.dirname(config.path), `${configName}.vlt`);
const lockPath = `${vaultPath}.lock`;
const backupPath = `${vaultPath}.backup`;
const legacyBackupPath = `${vaultPath}.legacy.bak`;

const ensurePrivateDirectory = () => {
  fs.mkdirSync(path.dirname(vaultPath), { recursive: true, mode: 0o700 });
  if (process.platform !== "win32") fs.chmodSync(path.dirname(vaultPath), 0o700);
};

const processIsAlive = (pid) => {
  if (!Number.isInteger(pid) || pid < 1) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === "EPERM";
  }
};

const clearStaleLock = () => {
  try {
    const state = JSON.parse(fs.readFileSync(lockPath, "utf8"));
    if (!processIsAlive(state.pid)) {
      fs.unlinkSync(lockPath);
      return true;
    }
  } catch (err) {
    if (err.code === "ENOENT") return true;
    try {
      const age = Date.now() - fs.statSync(lockPath).mtimeMs;
      if (age > 60000) {
        fs.unlinkSync(lockPath);
        return true;
      }
    } catch (statError) {
      return statError.code === "ENOENT";
    }
  }
  return false;
};

const withVaultLock = (operation) => {
  if (process.env.NODE_ENV === "test") return operation();
  ensurePrivateDirectory();
  let descriptor;
  try {
    descriptor = fs.openSync(lockPath, "wx", 0o600);
    fs.writeFileSync(descriptor, JSON.stringify({ pid: process.pid, createdAt: Date.now() }));
  } catch (err) {
    if (descriptor !== undefined) {
      try { fs.closeSync(descriptor); } catch (closeError) { /* best effort */ }
      descriptor = undefined;
      try { fs.unlinkSync(lockPath); } catch (unlinkError) { /* best effort */ }
    }
    if (err.code === "EEXIST" && clearStaleLock()) {
      try {
        descriptor = fs.openSync(lockPath, "wx", 0o600);
        fs.writeFileSync(descriptor, JSON.stringify({ pid: process.pid, createdAt: Date.now() }));
      } catch (retryError) {
        if (descriptor !== undefined) {
          try { fs.closeSync(descriptor); } catch (closeError) { /* best effort */ }
          descriptor = undefined;
          try { fs.unlinkSync(lockPath); } catch (unlinkError) { /* best effort */ }
        }
        if (retryError.code === "EEXIST") throw new VaultBusyError();
        throw new VaultStorageError("The vault lock could not be created.", retryError);
      }
    } else if (err.code === "EEXIST") {
      throw new VaultBusyError();
    } else {
      throw new VaultStorageError("The vault lock could not be created.", err);
    }
  }

  try {
    return operation();
  } finally {
    try { if (descriptor !== undefined) fs.closeSync(descriptor); } catch (err) { /* best effort */ }
    try { fs.unlinkSync(lockPath); } catch (err) { /* best effort */ }
  }
};

const getVaultData = () => {
  try {
    if (fs.existsSync(vaultPath)) return fs.readFileSync(vaultPath).toString("base64");
    return config.get("data");
  } catch (err) {
    throw new VaultStorageError("The vault could not be read.", err);
  }
};

const writeVaultData = (data) => {
  ensurePrivateDirectory();
  const temporaryPath = `${vaultPath}.${process.pid}.${crypto.randomBytes(6).toString("hex")}.tmp`;
  const bytes = Buffer.from(data, "base64");
  let descriptor;
  try {
    descriptor = fs.openSync(temporaryPath, "wx", 0o600);
    fs.writeFileSync(descriptor, bytes);
    fs.fsyncSync(descriptor);
    fs.closeSync(descriptor);
    descriptor = undefined;
    if (fs.existsSync(vaultPath)) {
      fs.copyFileSync(vaultPath, backupPath);
      if (process.platform !== "win32") fs.chmodSync(backupPath, 0o600);
    } else {
      const legacy = config.get("data");
      if (legacy && !fs.existsSync(legacyBackupPath)) {
        fs.writeFileSync(legacyBackupPath, Buffer.from(legacy, "base64"), { flag: "wx", mode: 0o600 });
      }
    }
    fs.renameSync(temporaryPath, vaultPath);
    if (process.platform !== "win32") fs.chmodSync(vaultPath, 0o600);
    if (process.platform !== "win32") {
      const directoryDescriptor = fs.openSync(path.dirname(vaultPath), "r");
      try { fs.fsyncSync(directoryDescriptor); } finally { fs.closeSync(directoryDescriptor); }
    }
    config.delete("data");
  } catch (err) {
    try { if (descriptor !== undefined) fs.closeSync(descriptor); } catch (closeError) { /* best effort */ }
    try { fs.unlinkSync(temporaryPath); } catch (unlinkError) { /* best effort */ }
    throw new VaultStorageError("The vault could not be saved atomically.", err);
  }
};

const setVaultData = (data, options = {}) => {
  if (options.locked) return writeVaultData(data);
  return withVaultLock(() => writeVaultData(data));
};

const setBannerColor = () => {
  if (config.get("bannerColor")) return;
  const color = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, "0")}`;

  config.set("bannerColor", color);
};

const getBannerColor = () => {
  return config.get("bannerColor");
};

const getClipboardWarningShown = () => Boolean(config.get("clipboardWarningShown"));
const setClipboardWarningShown = () => config.set("clipboardWarningShown", true);

module.exports = {
  getVaultData,
  setVaultData,
  withVaultLock,
  getVaultPath: () => vaultPath,
  getVaultBackupPath: () => backupPath,
  hasLegacyVaultData: () => !fs.existsSync(vaultPath) && Boolean(config.get("data")),
  getBannerColor,
  setBannerColor,
  getClipboardWarningShown,
  setClipboardWarningShown,
};
