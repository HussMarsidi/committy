import fs from "node:fs";
import path from "node:path";

export type RepoInfo = {
  repoRoot: string | null;
  isAtRoot: boolean;
};

export function detectRepo(cwd: string = process.cwd()): RepoInfo {
  let current = path.resolve(cwd);

  while (true) {
    const gitPath = path.join(current, ".git");
    if (fs.existsSync(gitPath)) {
      return {
        repoRoot: current,
        isAtRoot: path.resolve(cwd) === current,
      };
    }

    const parent = path.dirname(current);
    if (parent === current) {
      return { repoRoot: null, isAtRoot: false };
    }
    current = parent;
  }
}
