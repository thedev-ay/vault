const fs = require("fs");
const os = require("os");
const path = require("path");
const { execFileSync } = require("child_process");

describe("encrypted file storage", () => {
  let directory;

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), "vault-storage-test-"));
  });

  afterEach(() => {
    fs.rmSync(directory, { recursive: true, force: true });
  });

  test("migrates out of preferences and keeps private atomic backups", () => {
    const script = [
      "const repository = require('./src/infrastructure/vault-repository');",
      "const service = require('./src/application/vault-service');",
      "repository.initialize('secret');",
      "service.addCredential('secret', { account: 'github', userid: 'user', password: 'password', notes: '' });"
    ].join(" ");

    execFileSync(process.execPath, ["-e", script], {
      cwd: path.resolve(__dirname, "../.."),
      env: { ...process.env, XDG_CONFIG_HOME: directory, NODE_ENV: "production" }
    });

    const storageDirectory = path.join(directory, "configstore");
    const vaultPath = path.join(storageDirectory, "vault-prod.vlt");
    const backupPath = `${vaultPath}.backup`;
    const preferences = JSON.parse(fs.readFileSync(path.join(storageDirectory, "vault-prod.json"), "utf8"));

    expect(fs.readFileSync(vaultPath).subarray(0, 4).toString()).toBe("VLT3");
    expect(fs.existsSync(backupPath)).toBe(true);
    expect(preferences.data).toBeUndefined();
    if (process.platform !== "win32") {
      expect(fs.statSync(vaultPath).mode & 0o777).toBe(0o600);
      expect(fs.statSync(backupPath).mode & 0o777).toBe(0o600);
    }
  });
});
