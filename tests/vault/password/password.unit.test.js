const { changePassword } = require("../../../src/vault/password");
const config = require("../../../src/tools/config");
const crypto = require("../../../src/tools/crypto");

describe("vault/password", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("re-encrypts the vault with the new master password", () => {
    const currentSecret = "current secret";
    const newSecret = " new secret ";
    const vault = { acc: [{ userid: "user", password: " password ", notes: "" }] };
    const encrypted = crypto.encrypt(Buffer.from(JSON.stringify(vault)), currentSecret);
    jest.spyOn(config, "getVaultData").mockReturnValue(encrypted.toString("base64"));
    const setVaultData = jest.spyOn(config, "setVaultData").mockImplementation(() => {});

    changePassword(currentSecret, newSecret);

    const updated = Buffer.from(setVaultData.mock.calls[0][0], "base64");
    const decrypted = JSON.parse(crypto.decrypt(updated, newSecret).toString());
    expect(decrypted.schemaVersion).toBe(1);
    expect(decrypted.credentials[0]).toEqual(expect.objectContaining({
      account: "acc", userid: "user", password: " password ", notes: ""
    }));
    expect(() => crypto.decrypt(updated, currentSecret)).toThrow();
  });

  test("rejects an unchanged master password", () => {
    const setVaultData = jest.spyOn(config, "setVaultData").mockImplementation(() => {});
    expect(() => changePassword("same", "same")).toThrow("must be different");
    expect(setVaultData).not.toHaveBeenCalled();
  });
});
