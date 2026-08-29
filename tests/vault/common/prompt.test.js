jest.mock("inquirer", () => ({ prompt: jest.fn() }));

const inquirer = require("inquirer");
const session = require("../../../src/tools/session");
const config = require("../../../src/tools/config");
const crypto = require("../../../src/tools/crypto");
const { getUnlockedSecret, promptWithUnlockedSecret } = require("../../../src/vault/common/prompt");

describe("vault/common/prompt", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    inquirer.prompt.mockReset();
  });

  test("uses the active session without prompting for the password", async () => {
    jest.spyOn(session, "getSecret").mockResolvedValue("unlocked-secret");
    inquirer.prompt.mockResolvedValue({ userid: "person@example.com" });
    const questionSet = [
      { name: "secret", type: "password" },
      { name: "userid" }
    ];

    await expect(promptWithUnlockedSecret(questionSet)).resolves.toEqual({
      secret: "unlocked-secret",
      userid: "person@example.com"
    });
    expect(inquirer.prompt).toHaveBeenCalledWith([{ name: "userid" }]);
  });

  test("runs command validation before asking command-specific questions", async () => {
    jest.spyOn(session, "getSecret").mockResolvedValue("unlocked-secret");
    const beforePrompt = jest.fn().mockResolvedValue(undefined);
    inquirer.prompt.mockResolvedValue({ userid: "person@example.com" });

    await promptWithUnlockedSecret([{ name: "userid" }], beforePrompt);

    expect(beforePrompt).toHaveBeenCalledWith("unlocked-secret");
    expect(beforePrompt.mock.invocationCallOrder[0]).toBeLessThan(inquirer.prompt.mock.invocationCallOrder[0]);
  });

  test("leaves the command locked when inline unlock is declined", async () => {
    jest.spyOn(session, "getSecret").mockResolvedValue(undefined);
    jest.spyOn(config, "getVaultData").mockReturnValue("encrypted-vault");
    inquirer.prompt.mockResolvedValue({ proceed: false });

    await expect(getUnlockedSecret()).rejects.toThrow("Vault remains locked");
    expect(inquirer.prompt).toHaveBeenCalledTimes(1);
  });

  test("directs the user to initialize a missing vault", async () => {
    jest.spyOn(session, "getSecret").mockResolvedValue(undefined);
    jest.spyOn(config, "getVaultData").mockReturnValue(undefined);

    await expect(getUnlockedSecret()).rejects.toThrow("Run `vault init` first");
    expect(inquirer.prompt).not.toHaveBeenCalled();
  });

  test("unlocks inline and returns the password when accepted", async () => {
    const secret = "prompted-secret";
    const encrypted = crypto.encrypt(Buffer.from(JSON.stringify({})), secret);
    jest.spyOn(session, "getSecret").mockResolvedValue(undefined);
    jest.spyOn(session, "start").mockResolvedValue(Date.now() + 900000);
    jest.spyOn(config, "getVaultData").mockReturnValue(encrypted.toString("base64"));
    inquirer.prompt
      .mockResolvedValueOnce({ proceed: true })
      .mockResolvedValueOnce({ secret });

    await expect(getUnlockedSecret()).resolves.toBe(secret);
    expect(session.start).toHaveBeenCalledWith(secret, session.DEFAULT_MINUTES);
  });
});
