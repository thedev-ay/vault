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

const request = (action) => new Promise((resolve) => {
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
  client.on("connect", () => client.write(`${JSON.stringify({ action })}\n`));
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

const getSecret = async () => {
  const response = await request("get");
  return response && response.secret;
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
    child.send({ secret, minutes });
  });
};

const isAgentProcess = () => process.argv.includes(AGENT_ARGUMENT);

const runAgent = () => {
  process.once("message", ({ secret, minutes } = {}) => {
    if (!secret) process.exit(1);

    ensureDirectory();
    const paths = getPaths();
    if (process.platform !== "win32") removeFile(paths.socket);
    const expiresAt = Date.now() + (minutes * 60 * 1000);
    let shuttingDown = false;

    const server = net.createServer((client) => {
      client.setEncoding("utf8");
      let input = "";
      client.on("data", (chunk) => {
        input += chunk;
        if (!input.includes("\n")) return;

        let action;
        try {
          action = JSON.parse(input.trim()).action;
        } catch (err) {
          client.end(`${JSON.stringify({ error: "Invalid request" })}\n`);
          return;
        }

        if (action === "get" && Date.now() < expiresAt) {
          client.end(`${JSON.stringify({ secret })}\n`);
        } else if (action === "lock") {
          client.end(`${JSON.stringify({ locked: true })}\n`, shutdown);
        } else {
          client.end(`${JSON.stringify({ expired: true })}\n`);
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
  getSecret,
  isAgentProcess,
  runAgent,
  start,
  stop,
  validateMinutes
};
