const { fork, spawnSync } = require("child_process");

const CLEAR_ARGUMENT = "--vault-clear-clipboard";
const DEFAULT_CLEAR_SECONDS = 45;

const commands = () => {
  if (process.platform === "darwin") {
    return { write: ["pbcopy", []], read: ["pbpaste", []] };
  }
  if (process.platform === "win32") {
    return {
      write: ["clip.exe", []],
      read: ["powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", "Get-Clipboard -Raw"]]
    };
  }
  if (process.env.WAYLAND_DISPLAY) {
    return { write: ["wl-copy", []], read: ["wl-paste", ["--no-newline"]] };
  }
  return { write: ["xclip", ["-selection", "clipboard"]], read: ["xclip", ["-selection", "clipboard", "-o"]] };
};

const invoke = ([command, args], input) => spawnSync(command, args, {
  input,
  encoding: "utf8",
  windowsHide: true,
  timeout: 2000
});

const write = (value) => {
  const result = invoke(commands().write, value);
  if (result.error || result.status !== 0) {
    throw new Error("Clipboard access is unavailable in this environment.");
  }
};

const read = () => {
  const result = invoke(commands().read);
  if (result.error || result.status !== 0) return undefined;
  return typeof result.stdout === "string" ? result.stdout.replace(/[\r\n]+$/, "") : undefined;
};

const scheduleClear = (value, seconds = DEFAULT_CLEAR_SECONDS) => {
  const child = fork(process.argv[1], [CLEAR_ARGUMENT], {
    detached: true,
    stdio: ["ignore", "ignore", "ignore", "ipc"]
  });
  child.once("error", () => {});
  child.once("spawn", () => {
    child.send({ value, seconds });
    child.disconnect();
    child.unref();
  });
};

const copy = (value, options = {}) => {
  write(value);
  scheduleClear(value, options.clearSeconds);
};

const isClearProcess = () => process.argv.includes(CLEAR_ARGUMENT);

const runClearProcess = () => {
  process.once("message", ({ value, seconds } = {}) => {
    if (typeof value !== "string") process.exit(1);
    if (process.disconnect) process.disconnect();
    const timer = setTimeout(() => {
      try {
        if (read() === value) write("");
      } finally {
        process.exit(0);
      }
    }, Math.max(1, Number(seconds) || DEFAULT_CLEAR_SECONDS) * 1000);
    timer.ref();
  });
};

module.exports = {
  DEFAULT_CLEAR_SECONDS,
  copy,
  read,
  write,
  isClearProcess,
  runClearProcess
};
