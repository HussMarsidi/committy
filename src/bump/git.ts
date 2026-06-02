import { execSync } from "node:child_process";

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
  execSync(`git add ${files.join(" ")}`, { stdio: "pipe" });
}

export function gitCommit(version: string): void {
  execSync(`git commit -m "chore(release): v${version}"`, { stdio: "pipe" });
}

export function gitTag(version: string): void {
  execSync(`git tag v${version}`, { stdio: "pipe" });
}
