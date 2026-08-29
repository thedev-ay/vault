jest.mock("../../src/application/vault-service", () => ({
  listAccounts: jest.fn().mockReturnValue([{ account: "github", credentials: 1 }]),
  getCredentials: jest.fn(),
  addCredential: jest.fn(),
  updateCredential: jest.fn(),
  removeCredential: jest.fn(),
  exportEncrypted: jest.fn(),
  changePassword: jest.fn()
}));

const service = require("../../src/application/vault-service");
const router = require("../../src/application/session-router");

describe("application/session-router", () => {
  test("routes operations while keeping the master secret out of results", () => {
    const result = router.dispatch("master-password", "list");
    expect(service.listAccounts).toHaveBeenCalledWith("master-password");
    expect(JSON.stringify(result)).not.toContain("master-password");
  });

  test("rejects arbitrary operations", () => {
    expect(() => router.dispatch("secret", "shell", {})).toThrow("Unsupported");
  });
});
