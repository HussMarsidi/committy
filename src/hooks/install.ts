import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { detectHusky } from "./detect.js";
import { postCheckoutScript } from "./scripts.js";

const GC_HOOKS_DIR = ".gc/hooks";
const POST_CHECKOUT = "post-checkout";
const HUSKY_DELEGATION = 'sh .gc/hooks/post-checkout "$@"';
const PREPARE_SCRIPT = 'git config core.hooksPath .gc/hooks';

export type HookInstallResult =
  | { mode: "gcHooks"; hooksDir: string }
  | { mode: "husky"; huskyHooksDir: string };

function ensureExecutable(filePath: string): void {
  fs.chmodSync(filePath, 0o755);
}

function writePostCheckout(gcHooksDir: string): string {
  const hookPath = path.join(gcHooksDir, POST_CHECKOUT);
  fs.mkdirSync(gcHooksDir, { recursive: true });
  fs.writeFileSync(hookPath, postCheckoutScript(), "utf8");
  ensureExecutable(hookPath);
  return hookPath;
}

function readPackageJson(repoRoot: string): Record<string, unknown> {
  const pkgPath = path.join(repoRoot, "package.json");
  if (fs.existsSync(pkgPath)) {
    return JSON.parse(fs.readFileSync(pkgPath, "utf8")) as Record<string, unknown>;
  }
  return {};
}

function writePackageJson(repoRoot: string, pkg: Record<string, unknown>): void {
  const pkgPath = path.join(repoRoot, "package.json");
  fs.writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
}

function ensurePrepareScript(repoRoot: string): void {
  const pkg = readPackageJson(repoRoot);
  const scripts =
    typeof pkg.scripts === "object" && pkg.scripts !== null
      ? (pkg.scripts as Record<string, string>)
      : {};

  if (scripts.prepare) {
    return;
  }

  pkg.scripts = { ...scripts, prepare: PREPARE_SCRIPT };
  writePackageJson(repoRoot, pkg);
}

function configureGitHooksPath(repoRoot: string): void {
  execSync("git config core.hooksPath .gc/hooks", {
    cwd: repoRoot,
    stdio: "pipe",
  });
}

function ensureHuskyDelegation(huskyHooksDir: string): void {
  const huskyPostCheckout = path.join(huskyHooksDir, POST_CHECKOUT);
  const exists = fs.existsSync(huskyPostCheckout);
  const existing = exists ? fs.readFileSync(huskyPostCheckout, "utf8") : "";

  if (existing.includes(HUSKY_DELEGATION)) {
    return;
  }

  const header = exists && existing.trim().length > 0 ? existing.trimEnd() + "\n" : "#!/bin/sh\n";
  fs.writeFileSync(huskyPostCheckout, `${header}${HUSKY_DELEGATION}\n`, "utf8");
  ensureExecutable(huskyPostCheckout);
}

export function installHooks(repoRoot: string): HookInstallResult {
  const gcHooksDir = path.join(repoRoot, GC_HOOKS_DIR);
  writePostCheckout(gcHooksDir);

  const husky = detectHusky(repoRoot);
  if (husky.present) {
    ensureHuskyDelegation(husky.hooksDir);
    return { mode: "husky", huskyHooksDir: husky.hooksDir };
  }

  ensurePrepareScript(repoRoot);
  configureGitHooksPath(repoRoot);
  return { mode: "gcHooks", hooksDir: gcHooksDir };
}
