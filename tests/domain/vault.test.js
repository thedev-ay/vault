const vault = require("../../src/domain/vault");

describe("domain/vault", () => {
  test("migrates legacy records to stable IDs", () => {
    const result = vault.decode({ github: [{ userid: "me", password: "secret", notes: "" }] });
    expect(result.migrated).toBe(true);
    expect(result.vault.schemaVersion).toBe(1);
    expect(result.vault.credentials[0]).toEqual(expect.objectContaining({
      id: expect.any(String), account: "github", userid: "me"
    }));
    expect(vault.decode(result.vault).vault.credentials[0].id).toBe(result.vault.credentials[0].id);
  });

  test("updates account and username while retaining identity", () => {
    const model = vault.empty();
    const added = vault.addCredential(model, {
      account: "github", userid: "old", password: "secret", notes: ""
    });
    const updated = vault.updateCredential(model, added.id, { account: "gitlab", userid: "new" });
    expect(updated.id).toBe(added.id);
    expect(updated).toEqual(expect.objectContaining({ account: "gitlab", userid: "new" }));
  });

  test("rejects duplicate IDs and prototype account names", () => {
    expect(() => vault.decode(JSON.parse('{"__proto__":[]}'))).toThrow();
    const model = vault.empty();
    expect(() => vault.addCredential(model, {
      account: "constructor", userid: "me", password: "secret", notes: ""
    })).toThrow();
  });
});
