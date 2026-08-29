const session = require("../../src/tools/session");

describe("tools/session", () => {
  test("isolates sessions by encrypted vault path", () => {
    const user = "same-user";
    const first = session.createSessionId("/tmp/vault-one/vault-prod.vlt", user);
    const second = session.createSessionId("/tmp/vault-two/vault-prod.vlt", user);

    expect(first).not.toBe(second);
    expect(session.createSessionId("/tmp/vault-one/../vault-one/vault-prod.vlt", user)).toBe(first);
  });

  test("uses a 5 minute default session", () => {
    expect(session.validateMinutes()).toBe(5);
  });

  test("accepts a whole-number duration between one and 30 minutes", () => {
    expect(session.validateMinutes("1")).toBe(1);
    expect(session.validateMinutes("30")).toBe(30);
  });

  test.each(["0", "1.5", "31", "invalid"])("rejects invalid duration %s", (minutes) => {
    expect(() => session.validateMinutes(minutes)).toThrow("Session duration");
  });
});
