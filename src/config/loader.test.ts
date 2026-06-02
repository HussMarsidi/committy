import { describe, expect, it } from "vitest";
import { parseAndValidateConfig, loadConfigFromFile } from "./loader.js";
import { ConfigError } from "./types.js";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

describe("config loader", () => {
  it("parses valid config", () => {
    const config = parseAndValidateConfig(
      {
        types: ["feat", "fix"],
        scopes: [{ name: "auth", team: "PCUST" }, { name: "deps" }],
      },
      "/tmp/.gc.json",
    );
    expect(config.types).toEqual(["feat", "fix"]);
    expect(config.scopes).toHaveLength(2);
  });

  it("rejects empty types", () => {
    expect(() =>
      parseAndValidateConfig({ types: [], scopes: [] }, "/tmp/.gc.json"),
    ).toThrow(ConfigError);
  });

  it("rejects duplicate scope names", () => {
    expect(() =>
      parseAndValidateConfig(
        { types: ["feat"], scopes: [{ name: "auth" }, { name: "auth" }] },
        "/tmp/.gc.json",
      ),
    ).toThrow(/duplicate scope name/);
  });

  it("parses optional branches section", () => {
    const config = parseAndValidateConfig(
      {
        types: ["feat"],
        scopes: [],
        branches: {
          allowed: ["{type}/{description}"],
          types: ["feat", "fix"],
        },
      },
      "/tmp/.gc.json",
    );
    expect(config.branches).toEqual({
      allowed: ["{type}/{description}"],
      types: ["feat", "fix"],
    });
  });

  it("rejects malformed branches section", () => {
    expect(() =>
      parseAndValidateConfig(
        { types: ["feat"], scopes: [], branches: { allowed: [], types: ["feat"] } },
        "/tmp/.gc.json",
      ),
    ).toThrow(/branches\.allowed/);
  });

  it("rejects invalid JSON via loadConfigFromFile", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "gcv-test-"));
    const filePath = path.join(dir, ".gc.json");
    fs.writeFileSync(filePath, "{ not json");
    expect(() => loadConfigFromFile(filePath)).toThrow(/invalid JSON/);
  });
});
