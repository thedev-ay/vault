const crypto = require("crypto");
const fs = require("fs");
const https = require("https");
const os = require("os");
const path = require("path");
const zlib = require("zlib");
const { spawnSync } = require("child_process");

const OWNER = "thedev-ay";
const REPOSITORY = "vault";
const RELEASE_API = `https://api.github.com/repos/${OWNER}/${REPOSITORY}/releases/latest`;
const MAX_METADATA_BYTES = 1024 * 1024;
const MAX_PACKAGE_BYTES = 100 * 1024 * 1024;
const MAX_REDIRECTS = 5;

const parseVersion = (value) => {
  const match = String(value || "").match(/^v?(\d+)\.(\d+)\.(\d+)$/);
  if (!match) throw new Error(`Unsupported release version: ${value || "missing"}.`);
  return match.slice(1).map(Number);
};

const compareVersions = (left, right) => {
  const a = parseVersion(left);
  const b = parseVersion(right);
  for (let index = 0; index < 3; index += 1) {
    if (a[index] !== b[index]) return a[index] > b[index] ? 1 : -1;
  }
  return 0;
};

const request = (url, options = {}, redirects = 0) => new Promise((resolve, reject) => {
  const parsed = new URL(url);
  if (parsed.protocol !== "https:") {
    reject(new Error("System updates require HTTPS."));
    return;
  }

  const req = https.get(parsed, {
    headers: {
      "Accept": options.accept || "application/vnd.github+json",
      "User-Agent": `${REPOSITORY}-system-update`,
      "X-GitHub-Api-Version": "2022-11-28"
    },
    timeout: 15000
  }, (response) => {
    if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
      response.resume();
      if (!response.headers.location || redirects >= MAX_REDIRECTS) {
        reject(new Error("The update download redirected unexpectedly."));
        return;
      }
      resolve(request(new URL(response.headers.location, parsed).toString(), options, redirects + 1));
      return;
    }
    if (response.statusCode !== 200) {
      response.resume();
      reject(new Error(`Update server returned HTTP ${response.statusCode}.`));
      return;
    }

    const chunks = [];
    let length = 0;
    response.on("data", (chunk) => {
      length += chunk.length;
      if (length > (options.maxBytes || MAX_METADATA_BYTES)) {
        req.destroy(new Error("The update response is unexpectedly large."));
        return;
      }
      chunks.push(chunk);
    });
    response.on("end", () => resolve(Buffer.concat(chunks)));
    response.on("error", reject);
  });
  req.on("timeout", () => req.destroy(new Error("The update request timed out.")));
  req.on("error", reject);
});

const resolveRelease = (release, currentVersion) => {
  if (!release || release.draft || release.prerelease) throw new Error("No stable update release is available.");
  const version = String(release.tag_name || "").replace(/^v/, "");
  parseVersion(version);
  const packageName = `vault-system-${version}.tgz`;
  const checksumName = `${packageName}.sha256`;
  const assets = Array.isArray(release.assets) ? release.assets : [];
  const packageAsset = assets.find((asset) => asset.name === packageName);
  const checksumAsset = assets.find((asset) => asset.name === checksumName);
  if (!packageAsset || !checksumAsset) {
    throw new Error(`Release v${version} is missing its verified system-update artifacts.`);
  }
  const releasePrefix = `https://github.com/${OWNER}/${REPOSITORY}/releases/download/v${version}/`;
  if (!packageAsset.browser_download_url.startsWith(releasePrefix) ||
      !checksumAsset.browser_download_url.startsWith(releasePrefix)) {
    throw new Error("Release assets do not belong to the trusted Vault repository.");
  }
  return {
    currentVersion,
    version,
    updateAvailable: compareVersions(version, currentVersion) > 0,
    packageUrl: packageAsset.browser_download_url,
    checksumUrl: checksumAsset.browser_download_url,
    releaseUrl: release.html_url
  };
};

const check = async (currentVersion) => {
  let release;
  try {
    release = JSON.parse((await request(RELEASE_API)).toString("utf8"));
  } catch (err) {
    throw new Error(`Could not check for updates: ${err.message}`);
  }
  return resolveRelease(release, currentVersion);
};

const expectedChecksum = (contents, packageName) => {
  const line = contents.toString("utf8").trim();
  const match = line.match(/^([a-fA-F0-9]{64})(?:\s+\*?(.+))?$/);
  if (!match || (match[2] && path.basename(match[2]) !== packageName)) {
    throw new Error("The release checksum file is invalid.");
  }
  return match[1].toLowerCase();
};

const validatePackageManifest = (manifest, version) => {
  const repositoryUrl = manifest && manifest.repository &&
    (typeof manifest.repository === "string" ? manifest.repository : manifest.repository.url);
  if (!manifest || manifest.name !== "vault" || manifest.version !== version ||
      !repositoryUrl || !repositoryUrl.includes("github.com/thedev-ay/vault") ||
      !manifest.bin || manifest.bin.vault !== "./dist/main.js") {
    throw new Error("The verified archive does not contain the expected Vault package.");
  }
  return manifest;
};

const validateArchive = (archive, version) => {
  let contents;
  try {
    contents = zlib.gunzipSync(archive, { maxOutputLength: MAX_PACKAGE_BYTES * 4 });
  } catch (err) {
    throw new Error("The verified update archive is not a valid gzip package.");
  }
  let offset = 0;
  while (offset + 512 <= contents.length) {
    const header = contents.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;
    const name = header.subarray(0, 100).toString("utf8").replace(/\0.*$/, "");
    const sizeText = header.subarray(124, 136).toString("ascii").replace(/\0.*$/, "").trim();
    const size = Number.parseInt(sizeText || "0", 8);
    if (!Number.isSafeInteger(size) || size < 0 || offset + 512 + size > contents.length) break;
    if (name === "package/package.json") {
      try {
        return validatePackageManifest(
          JSON.parse(contents.subarray(offset + 512, offset + 512 + size).toString("utf8")),
          version
        );
      } catch (err) {
        if (err.message.includes("expected Vault package")) throw err;
        throw new Error("The verified archive contains invalid package metadata.");
      }
    }
    offset += 512 + (Math.ceil(size / 512) * 512);
  }
  throw new Error("The verified archive does not contain package metadata.");
};

const prepare = async (release) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "Vault-update-"));
  if (process.platform !== "win32") fs.chmodSync(directory, 0o700);
  const packageName = `vault-system-${release.version}.tgz`;
  const packagePath = path.join(directory, packageName);
  try {
    const [archive, checksumContents] = await Promise.all([
      request(release.packageUrl, { accept: "application/octet-stream", maxBytes: MAX_PACKAGE_BYTES }),
      request(release.checksumUrl, { accept: "application/octet-stream", maxBytes: MAX_METADATA_BYTES })
    ]);
    const expected = expectedChecksum(checksumContents, packageName);
    const actual = crypto.createHash("sha256").update(archive).digest("hex");
    if (actual !== expected) throw new Error("The downloaded update failed SHA-256 verification.");
    validateArchive(archive, release.version);
    fs.writeFileSync(packagePath, archive, { flag: "wx", mode: 0o600 });
    return { ...release, directory, packagePath };
  } catch (err) {
    fs.rmSync(directory, { recursive: true, force: true });
    throw err;
  }
};

const npmCommand = () => process.platform === "win32" ? "npm.cmd" : "npm";

const runNpm = (args, cacheDirectory) => spawnSync(npmCommand(), args, {
  encoding: "utf8",
  env: { ...process.env, npm_config_cache: cacheDirectory },
  windowsHide: true,
  timeout: 120000
});

const commandFailure = (label, result) => {
  const details = String(result.stderr || result.stdout || result.error && result.error.message || "unknown error").trim();
  return new Error(`${label}${details ? `: ${details}` : "."}`);
};

const applicationRoot = () => path.dirname(path.dirname(fs.realpathSync(process.argv[1])));

const installationPrefix = () => {
  const invoked = path.resolve(process.argv[1]);
  if (path.basename(path.dirname(invoked)) === "bin") return path.dirname(path.dirname(invoked));

  const currentMain = fs.realpathSync(process.argv[1]);
  const executableNames = process.platform === "win32" ? ["vault.cmd", "vault.exe", "vault"] : ["vault"];
  for (const directory of String(process.env.PATH || "").split(path.delimiter)) {
    for (const executableName of executableNames) {
      const candidate = path.join(directory, executableName);
      try {
        if (fs.realpathSync(candidate) === currentMain && path.basename(directory) === "bin") {
          return path.dirname(directory);
        }
      } catch (err) { /* Ignore missing and inaccessible PATH entries. */ }
    }
  }

  const root = applicationRoot();
  const modulesDirectory = path.dirname(root);
  if (path.basename(modulesDirectory) === "node_modules") {
    const parent = path.dirname(modulesDirectory);
    return ["lib", "lib64"].includes(path.basename(parent)) ? path.dirname(parent) : parent;
  }
  throw new Error("System update is available only from an installed `vault` command, not a source checkout.");
};

const install = (prepared) => {
  let rollbackPackage;
  try {
    const prefix = installationPrefix();
    const cacheDirectory = path.join(prepared.directory, "npm-cache");
    const backup = runNpm([
      "pack",
      applicationRoot(),
      "--pack-destination", prepared.directory,
      "--ignore-scripts",
      "--json"
    ], cacheDirectory);
    if (backup.error || backup.status !== 0) throw commandFailure("Could not create an application rollback package", backup);
    const packed = JSON.parse(backup.stdout);
    if (!Array.isArray(packed) || !packed[0] || !packed[0].filename) {
      throw new Error("Could not identify the application rollback package.");
    }
    rollbackPackage = path.join(prepared.directory, packed[0].filename);

    const installed = runNpm([
      "install", "--global", "--prefix", prefix, prepared.packagePath,
      "--ignore-scripts", "--no-audit", "--no-fund"
    ], cacheDirectory);
    if (installed.error || installed.status !== 0) throw commandFailure("System update failed", installed);
    const modulesDirectory = process.platform === "win32"
      ? path.join(prefix, "node_modules")
      : path.join(prefix, "lib", "node_modules");
    const installedManifest = JSON.parse(fs.readFileSync(path.join(modulesDirectory, "vault", "package.json"), "utf8"));
    validatePackageManifest(installedManifest, prepared.version);
    return { version: prepared.version };
  } catch (err) {
    if (rollbackPackage && fs.existsSync(rollbackPackage)) {
      const rollback = runNpm([
        "install", "--global", "--prefix", installationPrefix(), rollbackPackage,
        "--ignore-scripts", "--no-audit", "--no-fund"
      ], path.join(prepared.directory, "npm-cache"));
      if (rollback.error || rollback.status !== 0) {
        throw new Error(`${err.message} Automatic rollback also failed; reinstall the previous package manually.`);
      }
      throw new Error(`${err.message} The previous application version was restored.`);
    }
    throw err;
  } finally {
    fs.rmSync(prepared.directory, { recursive: true, force: true });
  }
};

module.exports = {
  RELEASE_API,
  parseVersion,
  compareVersions,
  resolveRelease,
  expectedChecksum,
  validatePackageManifest,
  validateArchive,
  check,
  prepare,
  install
};
