const crypto = require("crypto");
const updater = require("../../src/tools/system-update");

const release = (version) => ({
  tag_name: `v${version}`,
  draft: false,
  prerelease: false,
  html_url: `https://github.com/thedev-ay/vault/releases/tag/v${version}`,
  assets: [
    {
      name: `vault-system-${version}.tgz`,
      browser_download_url: `https://github.com/thedev-ay/vault/releases/download/v${version}/vault-system-${version}.tgz`
    },
    {
      name: `vault-system-${version}.tgz.sha256`,
      browser_download_url: `https://github.com/thedev-ay/vault/releases/download/v${version}/vault-system-${version}.tgz.sha256`
    }
  ]
});

describe("tools/system-update", () => {
  test("compares stable semantic versions without using an unrelated npm package", () => {
    expect(updater.compareVersions("2.1.0", "2.0.9")).toBe(1);
    expect(updater.compareVersions("2.0.0", "2.0.0")).toBe(0);
    expect(() => updater.parseVersion("latest")).toThrow("Unsupported release version");
    expect(updater.RELEASE_API).toBe("https://api.github.com/repos/thedev-ay/vault/releases/latest");
  });

  test("requires exact package and checksum assets from a stable release", () => {
    const resolved = updater.resolveRelease(release("2.1.0"), "2.0.0");
    expect(resolved).toEqual(expect.objectContaining({ version: "2.1.0", updateAvailable: true }));
    expect(() => updater.resolveRelease({ ...release("2.1.0"), assets: [] }, "2.0.0"))
      .toThrow("missing its verified");
  });

  test("validates checksum contents and their bound archive name", () => {
    const archive = Buffer.from("verified archive");
    const digest = crypto.createHash("sha256").update(archive).digest("hex");
    expect(updater.expectedChecksum(Buffer.from(`${digest}  vault-system-2.1.0.tgz\n`), "vault-system-2.1.0.tgz"))
      .toBe(digest);
    expect(() => updater.expectedChecksum(Buffer.from(`${digest}  another.tgz\n`), "vault-system-2.1.0.tgz"))
      .toThrow("checksum file is invalid");
  });

  test("binds package metadata to this repository and exact release version", () => {
    const manifest = {
      name: "vault",
      version: "2.1.0",
      repository: { url: "https://github.com/thedev-ay/vault.git" },
      bin: { vault: "./dist/main.js" }
    };
    expect(updater.validatePackageManifest(manifest, "2.1.0")).toBe(manifest);
    expect(() => updater.validatePackageManifest({ ...manifest, version: "9.9.9" }, "2.1.0"))
      .toThrow("expected Vault package");
    expect(() => updater.validatePackageManifest({ ...manifest, name: "unrelated-vault" }, "2.1.0"))
      .toThrow("expected Vault package");
  });
});
