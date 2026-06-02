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
import { spawn, type ChildProcess } from "node:child_process";
import { once, type EventEmitter } from "node:events";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { DEFAULT_TYPES } from "../config/defaults.js";
import type { GcConfig } from "../config/types.js";

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

type InitStep = { when: string; value: string };

function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, "");
}

/**
 * Drive `gcv init` by answering prompts in order. Each step matches a
 * substring of the stripped stdout (see init.ts / @inquirer messages).
 */
async function runInitInteractive(
  cwd: string,
  steps: InitStep[],
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  let buf = "";
  let stepIndex = 0;
  let searchFrom = 0;

  const child: ChildProcess = spawn("node", [CLI, "init"], {
    cwd,
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env, FORCE_COLOR: "0" },
  });

  if (!child.stdin || !child.stdout || !child.stderr) {
    throw new Error("gcv init subprocess missing stdio pipes");
  }

  const { stdin, stdout: childStdout, stderr: childStderr } = child;

  let stdout = "";
  let stderr = "";

  const tryAnswer = () => {
    const clean = stripAnsi(buf);
    while (stepIndex < steps.length) {
      const { when, value } = steps[stepIndex];
      const idx = clean.indexOf(when, searchFrom);
      if (idx === -1) break;
      stdin.write(`${value}\n`);
      searchFrom = idx + when.length;
      stepIndex++;
    }
  };

  childStdout.on("data", (chunk) => {
    stdout += chunk.toString();
    buf += chunk.toString();
    tryAnswer();
  });

  childStderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });

  const events = child as unknown as EventEmitter;
  const [code] = await Promise.race([
    once(events, "close"),
    once(events, "error").then(([err]) => {
      throw err;
    }),
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        child.kill();
        reject(
          new Error(
            `gcv init timed out after ${steps.length} steps (${stepIndex} answered)`,
          ),
        );
      }, 10_000);
    }),
  ]);

  return { exitCode: code ?? 1, stdout, stderr };
}

function readGcConfig(dir: string): GcConfig {
  return JSON.parse(readFileSync(join(dir, ".gc.json"), "utf8")) as GcConfig;
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
// gcv init
// ---------------------------------------------------------------------------

describe("gcv init", () => {
  it("exits 1 with an error when extra args are supplied", async () => {
    const dir = tempRepo(false);
    const { exitCode, stderr } = await run(["init", "extra"], dir);
    expect(exitCode).toBe(1);
    expect(stderr).toContain("does not accept additional arguments");
  });

  it("writes default types with empty scopes", async () => {
    const dir = tempRepo(false);
    const { exitCode, stdout } = await runInitInteractive(dir, [
      { when: "Add default conventional commit types? (y/N)", value: "y" },
      { when: "Add scopes now? (y/N)", value: "n" },
    ]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("Created");
    expect(readGcConfig(dir)).toEqual({
      types: [...DEFAULT_TYPES],
      scopes: [],
    });
  });

  it("writes default types and collected scopes", async () => {
    const dir = tempRepo(false);
    const { exitCode } = await runInitInteractive(dir, [
      { when: "Add default conventional commit types? (y/N)", value: "y" },
      { when: "Add scopes now? (y/N)", value: "y" },
      { when: "Scope name", value: "auth" },
      { when: "Team prefix (optional, press Enter to skip)", value: "" },
      { when: "Add another scope? (y/N)", value: "n" },
    ]);
    expect(exitCode).toBe(0);
    expect(readGcConfig(dir)).toEqual({
      types: [...DEFAULT_TYPES],
      scopes: [{ name: "auth" }],
    });
  });

  it("writes custom types without scopes", async () => {
    const dir = tempRepo(false);
    const { exitCode } = await runInitInteractive(dir, [
      { when: "Add default conventional commit types? (y/N)", value: "n" },
      { when: "Add scopes now? (y/N)", value: "n" },
      { when: "Commit type", value: "feat" },
      { when: "Add another type? (y/N)", value: "n" },
    ]);
    expect(exitCode).toBe(0);
    expect(readGcConfig(dir)).toEqual({
      types: ["feat"],
      scopes: [],
    });
  });

  it("writes custom types and scopes with team prefix", async () => {
    const dir = tempRepo(false);
    const { exitCode } = await runInitInteractive(dir, [
      { when: "Add default conventional commit types? (y/N)", value: "n" },
      { when: "Add scopes now? (y/N)", value: "y" },
      { when: "Commit type", value: "feat" },
      { when: "Add another type? (y/N)", value: "n" },
      { when: "Scope name", value: "auth" },
      { when: "Team prefix (optional, press Enter to skip)", value: "PCUST" },
      { when: "Add another scope? (y/N)", value: "n" },
    ]);
    expect(exitCode).toBe(0);
    expect(readGcConfig(dir)).toEqual({
      types: ["feat"],
      scopes: [{ name: "auth", team: "PCUST" }],
    });
  });

  it("overwrites an existing .gc.json when confirmed", async () => {
    const dir = tempRepo(false);
    const configPath = join(dir, ".gc.json");
    writeFileSync(
      configPath,
      `${JSON.stringify({ types: ["legacy"], scopes: [] }, null, 2)}\n`,
    );

    const { exitCode } = await runInitInteractive(dir, [
      { when: ".gc.json already exists. Overwrite? (y/N)", value: "y" },
      { when: "Add default conventional commit types? (y/N)", value: "y" },
      { when: "Add scopes now? (y/N)", value: "n" },
    ]);
    expect(exitCode).toBe(0);
    expect(readGcConfig(dir).types).toEqual([...DEFAULT_TYPES]);
  });

  it("keeps an existing .gc.json when overwrite is declined", async () => {
    const dir = tempRepo(false);
    const configPath = join(dir, ".gc.json");
    const existing = { types: ["legacy"], scopes: [] };
    writeFileSync(configPath, `${JSON.stringify(existing, null, 2)}\n`);

    const { exitCode, stdout } = await runInitInteractive(dir, [
      { when: ".gc.json already exists. Overwrite? (y/N)", value: "n" },
    ]);
    expect(exitCode).toBe(0);
    expect(stdout).not.toContain("Created");
    expect(readGcConfig(dir)).toEqual(existing);
  });

  it("writes .gc.json in a subdirectory when confirmed", async () => {
    const dir = tempRepo(false);
    const sub = join(dir, "pkg");
    mkdirSync(sub);

    const { exitCode, stdout } = await runInitInteractive(sub, [
      {
        when: "Not at repo root. Write .gc.json here anyway? (y/N)",
        value: "y",
      },
      { when: "Add default conventional commit types? (y/N)", value: "y" },
      { when: "Add scopes now? (y/N)", value: "n" },
    ]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain(join(sub, ".gc.json"));
    expect(readGcConfig(sub).types).toEqual([...DEFAULT_TYPES]);
    expect(() => readGcConfig(dir)).toThrow();
  });

  it("exits without writing .gc.json in a subdirectory when declined", async () => {
    const dir = tempRepo(false);
    const sub = join(dir, "pkg");
    mkdirSync(sub);

    const { exitCode, stdout } = await runInitInteractive(sub, [
      {
        when: "Not at repo root. Write .gc.json here anyway? (y/N)",
        value: "n",
      },
    ]);
    expect(exitCode).toBe(0);
    expect(stdout).not.toContain("Created");
    expect(() => readFileSync(join(sub, ".gc.json"))).toThrow();
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
