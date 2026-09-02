jest.mock("inquirer", () => ({ prompt: jest.fn() }));
jest.mock("../../../src/tools/system-update", () => ({
  check: jest.fn(),
  prepare: jest.fn(),
  install: jest.fn()
}));
jest.mock("../../../src/tools/session", () => ({ stop: jest.fn() }));
jest.mock("../../../src/tools/display", () => ({ banner: jest.fn(), error: jest.fn() }));
jest.mock("../../../src/tools/config", () => ({ getVaultPath: jest.fn(() => "/private/vault-prod.vlt") }));

const inquirer = require("inquirer");
const updater = require("../../../src/tools/system-update");
const session = require("../../../src/tools/session");
const display = require("../../../src/tools/display");
const { systemUpdatePrompt } = require("../../../src/vault/system-update/prompt");

describe("vault/system-update/prompt", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    updater.check.mockResolvedValue({
      currentVersion: "2.0.0",
      version: "2.1.0",
      updateAvailable: true
    });
    updater.prepare.mockResolvedValue({ version: "2.1.0", packagePath: "/tmp/update.tgz" });
    session.stop.mockResolvedValue(true);
  });

  test("check mode never downloads, installs, or locks", async () => {
    await systemUpdatePrompt({ check: true });
    expect(updater.prepare).not.toHaveBeenCalled();
    expect(updater.install).not.toHaveBeenCalled();
    expect(session.stop).not.toHaveBeenCalled();
  });

  test("installs only after confirmation and stops the session first", async () => {
    inquirer.prompt.mockResolvedValue({ proceed: true });
    await systemUpdatePrompt();

    expect(updater.prepare).toHaveBeenCalled();
    expect(session.stop).toHaveBeenCalled();
    expect(updater.install).toHaveBeenCalled();
    expect(session.stop.mock.invocationCallOrder[0]).toBeLessThan(updater.install.mock.invocationCallOrder[0]);
    expect(display.error).not.toHaveBeenCalled();
  });
});
