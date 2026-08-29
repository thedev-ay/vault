jest.mock("child_process", () => ({
  spawnSync: jest.fn().mockReturnValue({ status: 0, stdout: "value" }),
  fork: jest.fn()
}));

const childProcess = require("child_process");
const clipboard = require("../../src/tools/clipboard");

describe("tools/clipboard", () => {
  test("writes clipboard content through an argument-safe child process", () => {
    clipboard.write("p@ss $() `secret`");
    expect(childProcess.spawnSync).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Array),
      expect.objectContaining({ input: "p@ss $() `secret`" })
    );
  });

  test("reports unavailable clipboard commands", () => {
    childProcess.spawnSync.mockReturnValueOnce({ status: 1 });
    expect(() => clipboard.write("secret")).toThrow("Clipboard access is unavailable");
  });
});
