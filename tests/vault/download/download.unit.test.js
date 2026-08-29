const fs = require("fs");
const path = require("path");
const config = require("../../../src/tools/config");
const vaultCrypto = require("../../../src/tools/crypto");
const { download } = require("../../../src/vault/download");

describe("vault/download", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("creates an export exclusively in a private temporary directory", () => {
    const key = "key";
    const privateDirectory = path.join(process.cwd(), "Vault-private");
    const encrypted = vaultCrypto.encrypt(Buffer.from(JSON.stringify({})), key);
    jest.spyOn(config, "getVaultData").mockReturnValue(encrypted.toString("base64"));
    jest.spyOn(fs, "mkdtempSync").mockReturnValue(privateDirectory);
    const chmodSync = jest.spyOn(fs, "chmodSync").mockImplementation(() => {});
    const writeFileSync = jest.spyOn(fs, "writeFileSync").mockImplementation(() => {});

    const filePath = download(key);

    expect(fs.mkdtempSync).toHaveBeenCalledWith(expect.stringMatching(/Vault-$/));
    expect(path.dirname(filePath)).toBe(privateDirectory);
    expect(path.basename(filePath)).toMatch(/^vault_[0-9a-f-]+\.vlt\.enc$/);
    expect(writeFileSync).toHaveBeenCalledWith(filePath, encrypted, {
      flag: "wx",
      mode: 0o600
    });
    if (process.platform !== "win32") {
      expect(chmodSync).toHaveBeenCalledWith(privateDirectory, 0o700);
      expect(chmodSync).toHaveBeenCalledWith(filePath, 0o600);
    }
  });
});
