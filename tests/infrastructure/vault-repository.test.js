const config = require("../../src/tools/config");
const crypto = require("../../src/tools/crypto");
const repository = require("../../src/infrastructure/vault-repository");

describe("infrastructure/vault-repository", () => {
  afterEach(() => jest.restoreAllMocks());

  test("distinguishes authentication from authenticated schema corruption", () => {
    const secret = "secret";
    jest.spyOn(config, "getVaultData").mockReturnValue(
      crypto.encrypt(Buffer.from("not-json"), secret).toString("base64")
    );
    expect(() => repository.read(secret)).toThrow(expect.objectContaining({ code: "VAULT_CORRUPT" }));
    expect(() => repository.read("wrong")).toThrow(expect.objectContaining({ code: "AUTHENTICATION_FAILED" }));
  });

  test("does not write during an ordinary read", () => {
    const secret = "secret";
    const encoded = crypto.encrypt(Buffer.from(JSON.stringify({})), secret).toString("base64");
    jest.spyOn(config, "getVaultData").mockReturnValue(encoded);
    const write = jest.spyOn(config, "setVaultData").mockImplementation(() => {});
    expect(repository.read(secret).migrated).toBe(true);
    expect(write).not.toHaveBeenCalled();
  });
});
