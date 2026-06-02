/**
 * E2E tests for the `gcv` CLI.
 *
 * These spawn the real built binary via execa and assert on stdout / stderr /
 * exit code.  They require `dist/index.js` to exist — run `npm run build`
 * before `npm run test:e2e`.
 */

import { afterEach, describe, expect, it } from "vitest";
import { execa } from "execa";
import { execSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROOT = process.cwd();
const CLI = join(ROOT, "dist/index.js");
const VERSION = (
  JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
    version: string;
  }
).version;

/** Spawn the CLI. Never throws on non-zero exit — check `exitCode` yourself. */
function run(args: string[], cwd = ROOT) {
  return execa("node", [CLI, ...args], { cwd, reject: false });
}

const temps: string[] = [];

/** Create a temp git repo, optionally with a staged file ready to commit. */
function tempRepo(staged = true): string {
  const dir = mkdtempSync(join(tmpdir(), "committy-e2e-"));
  temps.push(dir);
  execSync("git init", { cwd: dir, stdio: "pipe" });
  execSync('git config user.email "ci@test.local"', { cwd: dir, stdio: "pipe" });
  execSync('git config user.name "CI"', { cwd: dir, stdio: "pipe" });
  if (staged) {
    writeFileSync(join(dir, "a.txt"), "hello");
    execSync("git add a.txt", { cwd: dir, stdio: "pipe" });
  }
  return dir;
}

afterEach(() => {
  for (const d of temps.splice(0)) rmSync(d, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// --help / -h
// ---------------------------------------------------------------------------

describe("gcv --help", () => {
  it("exits 0 and prints the usage header", async () => {
    const { exitCode, stdout } = await run(["--help"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("Usage: gcv");
  });

  it("-h is an alias for --help", async () => {
    const { exitCode, stdout } = await run(["-h"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("Usage: gcv");
  });

  it("output includes the inline-mode example block", async () => {
    const { stdout } = await run(["--help"]);
    expect(stdout).toContain("Inline mode:");
  });
});

// ---------------------------------------------------------------------------
// --version / -v
// ---------------------------------------------------------------------------

describe("gcv --version", () => {
  it("prints the package.json version and exits 0", async () => {
    const { exitCode, stdout } = await run(["--version"]);
    expect(exitCode).toBe(0);
    expect(stdout.trim()).toBe(VERSION);
  });

  it("-v is an alias for --version", async () => {
    const { exitCode, stdout } = await run(["-v"]);
    expect(exitCode).toBe(0);
    expect(stdout.trim()).toBe(VERSION);
  });
});

// ---------------------------------------------------------------------------
// Unknown flags
// ---------------------------------------------------------------------------

describe("unknown flags", () => {
  it("exits 1 and names the bad flag in stderr", async () => {
    const { exitCode, stderr } = await run(["--nope"]);
    expect(exitCode).toBe(1);
    expect(stderr).toContain("Unknown flag: --nope");
  });
});

// ---------------------------------------------------------------------------
// gcv init — argument validation (interactive paths not tested here)
// ---------------------------------------------------------------------------

describe("gcv init", () => {
  it("exits 1 with an error when extra args are supplied", async () => {
    const dir = tempRepo(false);
    const { exitCode, stderr } = await run(["init", "extra"], dir);
    expect(exitCode).toBe(1);
    expect(stderr).toContain("does not accept additional arguments");
  });
});

// ---------------------------------------------------------------------------
// Staged-files guard
// ---------------------------------------------------------------------------

describe("staged-files guard", () => {
  it("exits 0 with a hint when nothing is staged", async () => {
    const dir = tempRepo(false); // initialised repo, nothing staged
    const { exitCode, stdout } = await run([], dir);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("Nothing staged");
  });
});

// ---------------------------------------------------------------------------
// Inline commit mode — verifies the actual git commit subject
// ---------------------------------------------------------------------------

describe("inline commit", () => {
  it("type + message (2 args) → <type>: <message>", async () => {
    const dir = tempRepo();
    const { exitCode } = await run(["feat", "add login page"], dir);
    expect(exitCode).toBe(0);
    const subject = execSync("git log --format=%s -1", { cwd: dir })
      .toString()
      .trim();
    expect(subject).toBe("feat: add login page");
  });

  it("type + scope + message (3 args) → <type>(<scope>): <message>", async () => {
    const dir = tempRepo();
    const { exitCode } = await run(["fix", "auth", "handle expired tokens"], dir);
    expect(exitCode).toBe(0);
    const subject = execSync("git log --format=%s -1", { cwd: dir })
      .toString()
      .trim();
    expect(subject).toBe("fix(auth): handle expired tokens");
  });

  it("type + scope + multi-word message (4+ args) joins words correctly", async () => {
    const dir = tempRepo();
    const { exitCode } = await run(
      ["chore", "deps", "bump", "vitest", "to", "v3"],
      dir,
    );
    expect(exitCode).toBe(0);
    const subject = execSync("git log --format=%s -1", { cwd: dir })
      .toString()
      .trim();
    expect(subject).toBe("chore(deps): bump vitest to v3");
  });

  it("message with special characters is quoted safely", async () => {
    const dir = tempRepo();
    const { exitCode } = await run(["fix", 'say "hello"'], dir);
    expect(exitCode).toBe(0);
    const subject = execSync("git log --format=%s -1", { cwd: dir })
      .toString()
      .trim();
    expect(subject).toBe('fix: say "hello"');
  });
});
