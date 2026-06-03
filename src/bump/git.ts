import { execFileSync, execSync } from "node:child_process";

export function fetchRemoteTags(): void {
  try {
    const remotes = execSync("git remote", { stdio: "pipe", encoding: "utf8" }).trim();
    if (!remotes) return;
    process.stdout.write("Fetching remote tags (this may take a moment)...\n");
    execSync("git fetch --tags --quiet", { stdio: "pipe" });
  } catch {
    // No remote or network failure — continue with local tags
  }
}

export function isWorkingTreeDirty(): boolean {
  const output = execSync("git status --porcelain", {
    stdio: "pipe",
    encoding: "utf8",
  });
  return output.length > 0;
}

export function isGitRepo(): boolean {
  try {
    execSync("git rev-parse --git-dir", { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

export function gitAdd(files: string[]): void {
  execFileSync("git", ["add", ...files], { stdio: "pipe" });
}

export function gitCommit(version: string): void {
  execSync(`git commit -m "chore(release): v${version}"`, { stdio: "pipe" });
}

export function gitTag(version: string): void {
  execSync(`git tag v${version}`, { stdio: "pipe" });
}
