import * as NodeChildProcess from "node:child_process";
import * as NodeURL from "node:url";
import * as NodePath from "node:path";

const root = NodePath.resolve(NodePath.dirname(NodeURL.fileURLToPath(import.meta.url)), "..");
const mode = process.argv[2] ?? "dev";
if (!["dev", "dev:desktop", "dev:server", "dev:web"].includes(mode)) {
  throw new Error(`Unsupported Lancer development mode: ${mode}`);
}
const runtimeHome = NodePath.join(root, ".lancer-runtime");
const env = Object.fromEntries(
  Object.entries(process.env).filter(
    ([name]) =>
      !name.startsWith("LANCER_") &&
      !name.startsWith("T3CODE_") &&
      ![
        "ELECTRON_RUN_AS_NODE",
        "VITE_DEV_SERVER_URL",
        "VITE_HTTP_URL",
        "VITE_WS_URL",
        "PORT",
        "HOST",
      ].includes(name),
  ),
);
Object.assign(env, {
  LANCER_HOME: runtimeHome,
  LANCER_DEV_INSTANCE: root,
  LANCER_DEV_SEED: "0",
  LANCER_DISABLE_AUTO_UPDATE: "true",
  LANCER_DESKTOP_APP_USER_MODEL_ID: "ai.lancer.harness.dev",
});
const args = ["scripts/dev-runner.ts", mode, "--home-dir", runtimeHome, "--no-seed"];
if (process.argv.includes("--check")) {
  console.log(
    JSON.stringify({ cwd: root, args, runtimeHome, seed: false, autoUpdate: false }, null, 2),
  );
} else {
  const child = NodeChildProcess.spawn(process.execPath, args, {
    cwd: root,
    env,
    stdio: "inherit",
  });
  for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
  child.on("error", (error) => {
    console.error(error);
    process.exitCode = 1;
  });
  child.on("exit", (code) => {
    process.exitCode = code ?? 1;
  });
}
