import { execa } from "execa";
import { execSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const ROOT = process.cwd();

export const CLI = join(ROOT, "dist/index.js");

export const temps: string[] = [];

export function run(args: string[], cwd = ROOT) {
  return execa("node", [CLI, ...args], { cwd, reject: false });
}

export function cleanupTemps(): void {
  for (const d of temps.splice(0)) {
    rmSync(d, { recursive: true, force: true });
  }
}

function initGitRepo(dir: string): void {
  execSync("git init", { cwd: dir, stdio: "pipe" });
  execSync('git config user.email "ci@test.local"', { cwd: dir, stdio: "pipe" });
  execSync('git config user.name "CI"', { cwd: dir, stdio: "pipe" });
}

function writePackageJson(dir: string, version: string): void {
  writeFileSync(
    join(dir, "package.json"),
    `${JSON.stringify({ name: "e2e-app", version }, null, 2)}\n`,
  );
}

/** v0.1.0 tag plus one unreleased `feat` commit (minor bump / changelog content). */
export function tempReleaseRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), "committy-e2e-release-"));
  temps.push(dir);
  initGitRepo(dir);
  writePackageJson(dir, "0.1.0");
  execSync("git add package.json", { cwd: dir, stdio: "pipe" });
  execSync('git commit -m "chore: initial release"', { cwd: dir, stdio: "pipe" });
  execSync("git tag v0.1.0", { cwd: dir, stdio: "pipe" });
  writeFileSync(join(dir, "feature.txt"), "x");
  execSync("git add feature.txt", { cwd: dir, stdio: "pipe" });
  execSync('git commit -m "feat: add OAuth support"', { cwd: dir, stdio: "pipe" });
  return dir;
}

/** Tagged at HEAD with no commits after the tag. */
export function tempRepoAtTag(): string {
  const dir = mkdtempSync(join(tmpdir(), "committy-e2e-tagged-"));
  temps.push(dir);
  initGitRepo(dir);
  writePackageJson(dir, "0.1.0");
  execSync("git add package.json", { cwd: dir, stdio: "pipe" });
  execSync('git commit -m "chore: initial release"', { cwd: dir, stdio: "pipe" });
  execSync("git tag v0.1.0", { cwd: dir, stdio: "pipe" });
  return dir;
}

/** Temp directory that is not a git repository. */
export function tempNonRepoDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "committy-e2e-norepo-"));
  temps.push(dir);
  return dir;
}

export function readPackageVersion(dir: string): string {
  const pkg = JSON.parse(readFileSync(join(dir, "package.json"), "utf8")) as {
    version: string;
  };
  return pkg.version;
}
