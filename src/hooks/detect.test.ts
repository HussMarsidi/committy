import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { detectHusky } from "./detect.js";

const dirs: string[] = [];

function tempDir(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gcv-husky-"));
  dirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of dirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe("detectHusky", () => {
  it("detects husky in devDependencies", () => {
    const dir = tempDir();
    fs.writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({ devDependencies: { husky: "^9.0.0" } }),
    );
    expect(detectHusky(dir)).toEqual({ present: true, hooksDir: path.join(dir, ".husky") });
  });

  it("detects .husky directory", () => {
    const dir = tempDir();
    fs.mkdirSync(path.join(dir, ".husky"));
    expect(detectHusky(dir).present).toBe(true);
  });

  it("returns not present when neither signal exists", () => {
    const dir = tempDir();
    expect(detectHusky(dir)).toEqual({ present: false });
  });

  it("returns present when both signals exist", () => {
    const dir = tempDir();
    fs.mkdirSync(path.join(dir, ".husky"));
    fs.writeFileSync(
      path.join(dir, "package.json"),
      JSON.stringify({ devDependencies: { husky: "^9.0.0" } }),
    );
    expect(detectHusky(dir).present).toBe(true);
  });
});
