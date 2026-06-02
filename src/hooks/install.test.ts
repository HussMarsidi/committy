import { execSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { installHooks } from "./install.js";

const dirs: string[] = [];

function tempGitRepo(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gcv-hooks-"));
  dirs.push(dir);
  execSync("git init", { cwd: dir, stdio: "pipe" });
  execSync('git config user.email "test@example.com"', { cwd: dir, stdio: "pipe" });
  execSync('git config user.name "Test"', { cwd: dir, stdio: "pipe" });
  return dir;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("installHooks (no husky)", () => {
  it("creates executable post-checkout hook", () => {
    const dir = tempGitRepo();
    const result = installHooks(dir);
    expect(result.mode).toBe("gcHooks");

    const hookPath = path.join(dir, ".gc/hooks/post-checkout");
    expect(fs.existsSync(hookPath)).toBe(true);
    const mode = fs.statSync(hookPath).mode & 0o777;
    expect(mode).toBe(0o755);
    expect(fs.readFileSync(hookPath, "utf8")).toContain("gcv branch validate");
  });

  it("adds prepare script to package.json", () => {
    const dir = tempGitRepo();
    installHooks(dir);
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8")) as {
      scripts: { prepare: string };
    };
    expect(pkg.scripts.prepare).toContain("core.hooksPath");
  });

  it("does not overwrite existing prepare script", () => {
    const dir = tempGitRepo();
    fs.writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({ scripts: { prepare: "echo keep" } }, null, 2),
    );
    installHooks(dir);
    const pkg = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8")) as {
      scripts: { prepare: string };
    };
    expect(pkg.scripts.prepare).toBe("echo keep");
  });

  it("sets git core.hooksPath", () => {
    const dir = tempGitRepo();
    installHooks(dir);
    const hooksPath = execSync("git config core.hooksPath", { cwd: dir })
      .toString()
      .trim();
    expect(hooksPath).toBe(".gc/hooks");
  });
});

describe("installHooks (husky)", () => {
  it("delegates via .husky/post-checkout without changing package.json prepare", () => {
    const dir = tempGitRepo();
    fs.mkdirSync(path.join(dir, ".husky"));
    fs.writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({ devDependencies: { husky: "^9.0.0" } }, null, 2),
    );

    const result = installHooks(dir);
    expect(result.mode).toBe("husky");

    const huskyHook = fs.readFileSync(path.join(dir, ".husky/post-checkout"), "utf8");
    expect(huskyHook).toContain('sh .gc/hooks/post-checkout "$@"');

    const pkg = JSON.parse(fs.readFileSync(path.join(dir, "package.json"), "utf8")) as {
      scripts?: { prepare?: string };
    };
    expect(pkg.scripts?.prepare).toBeUndefined();
  });

  it("does not duplicate delegation on second install", () => {
    const dir = tempGitRepo();
    fs.mkdirSync(path.join(dir, ".husky"));
    installHooks(dir);
    installHooks(dir);
    const huskyHook = fs.readFileSync(path.join(dir, ".husky/post-checkout"), "utf8");
    const matches = huskyHook.match(/sh \.gc\/hooks\/post-checkout/g) ?? [];
    expect(matches).toHaveLength(1);
  });
});
