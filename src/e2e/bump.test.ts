import { afterEach, describe, expect, it } from "vitest";
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  cleanupTemps,
  readPackageVersion,
  run,
  tempNonRepoDir,
  tempReleaseRepo,
  tempRepoAtTag,
} from "./helpers.js";

afterEach(() => cleanupTemps());

describe("gcv bump", () => {
  it("--dry-run prints detected bump without writing or committing", async () => {
    const dir = tempReleaseRepo();
    const { exitCode, stdout } = await run(["bump", "--dry-run"], dir);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Detected:");
    expect(stdout).toContain("Current:  0.1.0");
    expect(stdout).toContain("Next:     0.2.0");
    expect(stdout).toContain("--dry-run: no files written, no commit, no tag.");
    expect(readPackageVersion(dir)).toBe("0.1.0");
    expect(existsSync(join(dir, "CHANGELOG.md"))).toBe(false);
  });

  it("bumps version, writes changelog, commits, and tags", async () => {
    const dir = tempReleaseRepo();
    const { exitCode, stdout } = await run(["bump"], dir);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Changelog written to CHANGELOG.md");
    expect(stdout).toContain("Bumped 0.1.0 → 0.2.0 (minor)");
    expect(stdout).toContain("Tagged v0.2.0");

    expect(readPackageVersion(dir)).toBe("0.2.0");
    expect(existsSync(join(dir, "CHANGELOG.md"))).toBe(true);
    expect(readFileSync(join(dir, "CHANGELOG.md"), "utf8")).toContain("0.2.0");

    const tags = execSync("git tag -l", { cwd: dir }).toString().trim().split("\n");
    expect(tags).toContain("v0.2.0");

    const subject = execSync("git log --format=%s -1", { cwd: dir }).toString().trim();
    expect(subject).toBe("chore(release): v0.2.0");
  });

  it("--no-tag commits without creating a tag", async () => {
    const dir = tempReleaseRepo();
    const { exitCode, stdout } = await run(["bump", "--no-tag"], dir);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Bumped 0.1.0 → 0.2.0 (minor)");
    expect(stdout).not.toContain("Tagged v");

    const tags = execSync("git tag -l", { cwd: dir }).toString().trim().split("\n");
    expect(tags).toEqual(["v0.1.0"]);
  });

  it("--patch override bumps patch version", async () => {
    const dir = tempReleaseRepo();
    const { exitCode, stdout } = await run(["bump", "--patch", "--dry-run"], dir);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Detected: patch");
    expect(stdout).toContain("Next:     0.1.1");
  });

  it("exits 0 when there is nothing to bump since the last tag", async () => {
    const dir = tempRepoAtTag();
    const { exitCode, stdout } = await run(["bump"], dir);

    expect(exitCode).toBe(0);
    expect(stdout).toContain("Nothing to bump — no commits since the last tag.");
  });

  it("exits 1 when the working tree is dirty", async () => {
    const dir = tempReleaseRepo();
    writeFileSync(join(dir, "dirty.txt"), "uncommitted");
    const { exitCode, stderr } = await run(["bump"], dir);

    expect(exitCode).toBe(1);
    expect(stderr).toContain("Working tree is dirty");
  });

  it("exits 1 outside a git repository", async () => {
    const dir = tempNonRepoDir();
    const { exitCode, stderr } = await run(["bump"], dir);

    expect(exitCode).toBe(1);
    expect(stderr).toContain("Not a git repository.");
  });

  it("help lists bump command and flags", async () => {
    const { exitCode, stdout } = await run(["--help"]);
    expect(exitCode).toBe(0);
    expect(stdout).toContain("gcv bump");
    expect(stdout).toContain("--major");
    expect(stdout).toContain("--dry-run");
    expect(stdout).toContain("--no-tag");
  });
});
