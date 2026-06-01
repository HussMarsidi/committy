import { execSync } from "node:child_process";

export function hasStagedFiles(): boolean {
  try {
    execSync("git diff --cached --quiet", { stdio: "pipe" });
    return false;
  } catch (error: unknown) {
    const err = error as { status?: number; stderr?: Buffer };
    if (err.status === 1) {
      return true;
    }
    const stderr = err.stderr?.toString().trim();
    console.error(stderr || "Failed to check staged files. Are you in a git repository?");
    process.exit(1);
  }
}
