import { execSync } from "node:child_process";

export function runGitCommit(message: string): void {
  try {
    execSync(`git commit -m ${JSON.stringify(message)}`, {
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
