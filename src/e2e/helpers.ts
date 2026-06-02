import { execa } from "execa";
import { execSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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

/**
 * Repo where v1.0.0 exists only on a local bare "remote" — not fetched locally.
 * Simulates a non-greenfield project where tags were pushed via GitHub.
 * Has one unreleased `feat` commit on top.
 */
export function tempRepoWithRemoteOnlyTags(): string {
  // Bare repo acting as the remote
  const remoteDir = mkdtempSync(join(tmpdir(), "committy-e2e-remote-"));
  temps.push(remoteDir);
  execSync("git init --bare", { cwd: remoteDir, stdio: "pipe" });

  // Working local clone
  const localDir = mkdtempSync(join(tmpdir(), "committy-e2e-nongreen-"));
  temps.push(localDir);
  initGitRepo(localDir);
  execSync(`git remote add origin ${remoteDir}`, { cwd: localDir, stdio: "pipe" });

  writePackageJson(localDir, "1.0.0");
  execSync("git add package.json", { cwd: localDir, stdio: "pipe" });
  execSync('git commit -m "chore: initial release"', { cwd: localDir, stdio: "pipe" });
  execSync("git tag v1.0.0", { cwd: localDir, stdio: "pipe" });
  execSync("git push origin HEAD --tags", { cwd: localDir, stdio: "pipe" });

  // Delete local tag — now v1.0.0 exists only on the remote
  execSync("git tag -d v1.0.0", { cwd: localDir, stdio: "pipe" });

  // One unreleased feat commit
  writeFileSync(join(localDir, "feature.txt"), "x");
  execSync("git add feature.txt", { cwd: localDir, stdio: "pipe" });
  execSync('git commit -m "feat: add OAuth support"', { cwd: localDir, stdio: "pipe" });

  return localDir;
}

/** Returns true if the given dir has no git remote configured. */
export function hasNoRemote(dir: string): boolean {
  const remotes = execSync("git remote", { cwd: dir, stdio: "pipe", encoding: "utf8" }).trim();
  return remotes === "";
}
