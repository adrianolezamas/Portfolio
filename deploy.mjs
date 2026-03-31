#!/usr/bin/env node
// deploy.mjs — run with: node deploy.mjs
// Stages all changes, commits with a timestamp, and pushes to GitHub.
// Vercel auto-deploys from there.

import { execSync } from "child_process";

const run = (cmd) => execSync(cmd, { stdio: "inherit", cwd: import.meta.dirname });

const timestamp = new Date().toLocaleString("en-US", {
  month: "short", day: "numeric", year: "numeric",
  hour: "2-digit", minute: "2-digit",
});

try {
  run("git add -A");
  // Check if there's anything to commit
  const status = execSync("git status --porcelain").toString().trim();
  if (!status) {
    console.log("Nothing to commit — already up to date.");
    process.exit(0);
  }
  run(`git commit -m "Update ${timestamp}"`);
  run("git push origin main");
  console.log("\n✓ Pushed to GitHub. Vercel will deploy automatically.\n");
} catch (err) {
  console.error("\n✗ Deploy failed:", err.message);
  process.exit(1);
}
