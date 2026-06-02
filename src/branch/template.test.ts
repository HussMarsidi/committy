import { describe, expect, it } from "vitest";
import { compilePattern, extractSegments } from "./template.js";

const types = ["feat", "fix"];

describe("compilePattern", () => {
  it("matches type/description pattern", () => {
    const re = compilePattern("{type}/{description}", types);
    expect(re.test("feat/add-login")).toBe(true);
    expect(re.test("wip/add-login")).toBe(false);
  });

  it("matches type/ticket-description pattern", () => {
    const re = compilePattern("{type}/{ticket}-{description}", types);
    expect(re.test("feat/PROJ-123-add-login")).toBe(true);
    expect(re.test("feat/proj-123-add-login")).toBe(false);
  });

  it("matches literal pattern with no placeholders", () => {
    const re = compilePattern("main", types);
    expect(re.test("main")).toBe(true);
    expect(re.test("feat/main")).toBe(false);
  });
});

describe("extractSegments", () => {
  it("extracts type and description", () => {
    expect(extractSegments("{type}/{description}")).toEqual(["type", "description"]);
  });

  it("extracts type, ticket, and description", () => {
    expect(extractSegments("{type}/{ticket}-{description}")).toEqual([
      "type",
      "ticket",
      "description",
    ]);
  });
});
