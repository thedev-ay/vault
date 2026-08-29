jest.mock("inquirer", () => ({ prompt: jest.fn() }));

const inquirer = require("inquirer");
const session = require("../../../src/tools/session");
const config = require("../../../src/tools/config");
const service = require("../../../src/application/vault-service");
const { ensureUnlocked, promptWithUnlockedSession } = require("../../../src/vault/common/prompt");

describe("vault/common/prompt", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    inquirer.prompt.mockReset();
  });

  test("uses an active session without requesting or returning its password", async () => {
    jest.spyOn(session, "isUnlocked").mockResolvedValue(true);
    inquirer.prompt.mockResolvedValue({ userid: "person@example.com" });

    await expect(promptWithUnlockedSession([{ name: "secret" }, { name: "userid" }]))
      .resolves.toEqual({ userid: "person@example.com" });
    expect(inquirer.prompt).toHaveBeenCalledWith([{ name: "userid" }]);
  });

  test("runs validation before command-specific questions", async () => {
    jest.spyOn(session, "isUnlocked").mockResolvedValue(true);
    const beforePrompt = jest.fn().mockResolvedValue(undefined);
    inquirer.prompt.mockResolvedValue({ userid: "person@example.com" });

    await promptWithUnlockedSession([{ name: "userid" }], beforePrompt);
    expect(beforePrompt.mock.invocationCallOrder[0]).toBeLessThan(inquirer.prompt.mock.invocationCallOrder[0]);
  });

  test("leaves the command locked when inline unlock is declined", async () => {
    jest.spyOn(session, "isUnlocked").mockResolvedValue(false);
    jest.spyOn(config, "getVaultData").mockReturnValue("encrypted-vault");
    inquirer.prompt.mockResolvedValue({ proceed: false });

    await expect(ensureUnlocked()).rejects.toThrow("Vault remains locked");
  });

  test("directs the user to initialize a missing vault", async () => {
    jest.spyOn(session, "isUnlocked").mockResolvedValue(false);
    jest.spyOn(config, "getVaultData").mockReturnValue(undefined);
    await expect(ensureUnlocked()).rejects.toThrow("Run `vault init` first");
  });

  test("migrates before starting an inline session", async () => {
    jest.spyOn(session, "isUnlocked").mockResolvedValue(false);
    jest.spyOn(session, "start").mockResolvedValue(Date.now() + 900000);
    jest.spyOn(config, "getVaultData").mockReturnValue("encrypted");
    const migrate = jest.spyOn(service, "migrate").mockReturnValue({ migrated: true });
    inquirer.prompt.mockResolvedValueOnce({ proceed: true }).mockResolvedValueOnce({ secret: "secret" });

    await expect(ensureUnlocked()).resolves.toBe(true);
    expect(migrate).toHaveBeenCalledWith("secret");
    expect(session.start).toHaveBeenCalledWith("secret", session.DEFAULT_MINUTES);
  });
});
