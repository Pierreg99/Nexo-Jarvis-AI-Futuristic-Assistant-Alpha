import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function run(command, args, cwd = root, env = process.env) {
  const result = spawnSync(command, args, { cwd, env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

// Override a Pages base path so all bundled assets resolve on the local Android origin.
run(process.execPath, ["node_modules/vite/bin/vite.js", "build"], root, {
  ...process.env,
  VITE_BASE_PATH: "/",
});
if (!process.argv.includes("--prepare-only")) {
  const windows = process.platform === "win32";
  run(
    windows ? "cmd.exe" : "sh",
    windows
      ? ["/c", "gradlew.bat", "--no-daemon", "assembleDebug", "lintDebug"]
      : ["./gradlew", "--no-daemon", "assembleDebug", "lintDebug"],
    path.join(root, "android")
  );
  const artifactDir = path.join(root, "artifacts");
  mkdirSync(artifactDir, { recursive: true });
  const apk = path.join(artifactDir, "nexo-jarvis-1.0.0-alpha.2-debug.apk");
  copyFileSync(
    path.join(root, "android/app/build/outputs/apk/debug/app-debug.apk"),
    apk
  );
  const checksum = createHash("sha256").update(readFileSync(apk)).digest("hex");
  writeFileSync(`${apk}.sha256`, `${checksum}  ${path.basename(apk)}\n`);
  console.log(`APK: ${apk}\nSHA-256: ${checksum}`);
}
