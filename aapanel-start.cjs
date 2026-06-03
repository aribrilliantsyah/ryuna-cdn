// aapanel-start.cjs
// Script khusus untuk aaPanel: build dulu, lalu jalankan server.
const { spawnSync, spawn } = require("node:child_process");
const path = require("node:path");

const cwd = __dirname;

console.log("[aapanel] Building...");

// 1. Build dulu (tsc -p tsconfig.json lewat pnpm)
const build = spawnSync("pnpm", ["build"], {
  cwd,
  stdio: "inherit",
  shell: true,            // penting di sebagian environment aaPanel
});

if (build.status !== 0) {
  console.error("[aapanel] Build GAGAL, server tidak dijalankan.");
  process.exit(build.status || 1);
}

console.log("[aapanel] Build sukses. Menjalankan server...");

// 2. Jalankan hasil build
require(path.join(cwd, "dist", "index.js"));