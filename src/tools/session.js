const crypto = require("crypto");
const fs = require("fs");
const net = require("net");
const os = require("os");
const path = require("path");
const { fork } = require("child_process");
const packageJson = require("../../package.json");

const AGENT_ARGUMENT = "--vault-session-agent";
const DEFAULT_MINUTES = 5;
const MAX_MINUTES = 30;
const REQUEST_TIMEOUT_MS = 1000;
const MAX_REQUEST_BYTES = 1024 * 1024;

const sessionId = () => crypto
  .createHash("sha256")
  .update(`${packageJson.name}:${process.env.NODE_ENV || "development"}:${process.getuid ? process.getuid() : os.userInfo().username}`)
  .digest("hex")
  .slice(0, 12);

const getPaths = () => {
  const id = sessionId();
  const directory = path.join(os.tmpdir(), `${packageJson.name}-${id}`);

  return {
    directory,
    socket: process.platform === "win32"
      ? `\\\\.\\pipe\\${packageJson.name}-${id}`
      : path.join(directory, "session.sock"),
    state: path.join(directory, "session.json")
  };
};

const ensureDirectory = () => {
  const { directory } = getPaths();
  fs.mkdirSync(directory, { recursive: true, mode: 0o700 });
  if (process.platform !== "win32") fs.chmodSync(directory, 0o700);
};

const removeFile = (filename) => {
  try {
    fs.unlinkSync(filename);
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
};

const cleanUp = () => {
  const paths = getPaths();
  removeFile(paths.state);
  if (process.platform !== "win32") removeFile(paths.socket);
  try {
    fs.rmdirSync(paths.directory);
  } catch (err) {
    if (err.code !== "ENOENT" && err.code !== "ENOTEMPTY") throw err;
  }
};

const readState = () => {
  try {
    return JSON.parse(fs.readFileSync(getPaths().state, "utf8"));
  } catch (err) {
    return undefined;
  }
};

const request = (action, payload) => new Promise((resolve) => {
  const state = readState();
  if (!state || !Number.isFinite(state.expiresAt) || state.expiresAt <= Date.now()) {
    try { cleanUp(); } catch (err) { /* A stale session can safely be ignored. */ }
    resolve(undefined);
    return;
  }

  const client = net.createConnection(getPaths().socket);
  let response = "";
  let settled = false;

  const finish = (value) => {
    if (settled) return;
    settled = true;
    client.destroy();
    resolve(value);
  };

  client.setEncoding("utf8");
  client.setTimeout(REQUEST_TIMEOUT_MS);
  client.on("connect", () => client.write(`${JSON.stringify({ action, payload })}\n`));
  client.on("data", (chunk) => {
    response += chunk;
    if (!response.includes("\n")) return;
    try {
      finish(JSON.parse(response.trim()));
    } catch (err) {
      finish(undefined);
    }
  });
  client.on("timeout", () => finish(undefined));
  client.on("error", () => finish(undefined));
  client.on("end", () => finish(undefined));
});

const isUnlocked = async () => {
  const response = await request("status");
  return Boolean(response && response.ok && response.result && response.result.unlocked);
};

const execute = async (action, payload) => {
  const response = await request("execute", { action, payload });
  if (!response || !response.ok) {
    const error = new Error(response && response.error ? response.error.message : "The unlock session is unavailable.");
    if (response && response.error) error.code = response.error.code;
    throw error;
  }
  return response.result;
};

const stop = async () => {
  const response = await request("lock");
  try { cleanUp(); } catch (err) { /* The agent may have already cleaned up. */ }
  return Boolean(response && response.locked);
};

const validateMinutes = (value) => {
  const minutes = value === undefined ? DEFAULT_MINUTES : Number(value);
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > MAX_MINUTES) {
    throw new Error(`Session duration must be a whole number from 1 to ${MAX_MINUTES} minutes.`);
  }
  return minutes;
};

const start = async (secret, requestedMinutes) => {
  const minutes = validateMinutes(requestedMinutes);
  await stop();
  const config = require("./config");
  const vaultCrypto = require("./crypto");
  let context;
  try {
    context = vaultCrypto.createSessionContext(Buffer.from(config.getVaultData(), "base64"), secret);
  } finally {
    secret = undefined;
  }

  return new Promise((resolve, reject) => {
    const child = fork(process.argv[1], [AGENT_ARGUMENT], {
      detached: true,
      stdio: ["ignore", "ignore", "ignore", "ipc"]
    });
    const timeout = setTimeout(() => {
      child.kill();
      reject(new Error("Could not start the unlock session."));
    }, 3000);

    child.once("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });
    child.once("message", (message) => {
      clearTimeout(timeout);
      if (!message || !message.ready) {
        reject(new Error(message && message.error ? message.error : "Could not start the unlock session."));
        return;
      }
      child.disconnect();
      child.unref();
      resolve(message.expiresAt);
    });
    child.send({ context, minutes });
  });
};

const isAgentProcess = () => process.argv.includes(AGENT_ARGUMENT);

const runAgent = () => {
  process.once("message", ({ context, minutes } = {}) => {
    if (!context) process.exit(1);

    ensureDirectory();
    const paths = getPaths();
    if (process.platform !== "win32") removeFile(paths.socket);
    const expiresAt = Date.now() + (minutes * 60 * 1000);
    let shuttingDown = false;

    const router = require("../application/session-router");
    const server = net.createServer((client) => {
      client.setEncoding("utf8");
      let input = "";
      let processed = false;
      client.on("data", (chunk) => {
        if (processed) return;
        input += chunk;
        if (Buffer.byteLength(input, "utf8") > MAX_REQUEST_BYTES) {
          processed = true;
          client.end(`${JSON.stringify({ ok: false, error: { message: "Request is too large." } })}\n`);
          return;
        }
        if (!input.includes("\n")) return;
        processed = true;

        let requestMessage;
        try {
          requestMessage = JSON.parse(input.trim());
        } catch (err) {
          client.end(`${JSON.stringify({ error: "Invalid request" })}\n`);
          return;
        }

        if (requestMessage.action === "status" && Date.now() < expiresAt) {
          client.end(`${JSON.stringify({ ok: true, result: { unlocked: true, expiresAt } })}\n`);
        } else if (requestMessage.action === "execute" && Date.now() < expiresAt) {
          try {
            const operation = requestMessage.payload || {};
            const result = router.dispatch(context, operation.action, operation.payload);
            const response = `${JSON.stringify({ ok: true, result })}\n`;
            if (operation.action === "password") client.end(response, shutdown);
            else client.end(response);
          } catch (err) {
            client.end(`${JSON.stringify({
              ok: false,
              error: { code: err.code || "OPERATION_FAILED", message: err.message || String(err) }
            })}\n`);
          }
        } else if (requestMessage.action === "lock") {
          client.end(`${JSON.stringify({ ok: true, locked: true })}\n`, shutdown);
        } else {
          client.end(`${JSON.stringify({ ok: false, expired: true })}\n`);
        }
      });
    });

    const shutdown = () => {
      if (shuttingDown) return;
      shuttingDown = true;
      server.close(() => {
        try { cleanUp(); } finally { process.exit(0); }
      });
    };

    server.on("error", (err) => {
      if (process.send) process.send({ error: `Could not start the unlock session: ${err.message}` });
      try { cleanUp(); } finally { process.exit(1); }
    });
    server.listen(paths.socket, () => {
      if (process.platform !== "win32") fs.chmodSync(paths.socket, 0o600);
      fs.writeFileSync(paths.state, JSON.stringify({ expiresAt, pid: process.pid }), { mode: 0o600 });
      if (process.send) process.send({ ready: true, expiresAt });
      if (process.disconnect) process.disconnect();
    });

    const timer = setTimeout(shutdown, minutes * 60 * 1000);
    timer.unref();
    process.once("SIGTERM", shutdown);
    process.once("SIGINT", shutdown);
  });
};

module.exports = {
  DEFAULT_MINUTES,
  execute,
  isUnlocked,
  isAgentProcess,
  runAgent,
  start,
  stop,
  validateMinutes
};
