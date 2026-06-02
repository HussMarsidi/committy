import { execSync } from "node:child_process";

export function runGitBranch(name: string): void {
  try {
    execSync(`git switch -c ${JSON.stringify(name)}`, {
      stdio: "inherit",
    });
  } catch (error: unknown) {
    const err = error as { stderr?: Buffer };
    const stderr = err.stderr?.toString().trim();
    if (stderr) {
      console.error(stderr);
    }
    process.exit(1);
  }
}
