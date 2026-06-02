import { beforeEach, describe, expect, it, vi } from "vitest";

const bump = vi.fn();

vi.mock("conventional-recommended-bump", () => ({
  Bumper: vi.fn().mockImplementation(() => ({
    loadPreset: vi.fn().mockReturnThis(),
    bump,
  })),
}));

import { detectBumpType } from "./detect.js";

describe("detectBumpType", () => {
  beforeEach(() => {
    bump.mockReset();
  });

  it("returns recommendation when commits exist", async () => {
    bump.mockResolvedValue({
      releaseType: "minor",
      reason: "features",
      commits: [{ header: "feat: x" }],
    });

    await expect(detectBumpType()).resolves.toEqual({
      releaseType: "minor",
      reason: "features",
    });
  });

  it("returns null when there are no commits", async () => {
    bump.mockResolvedValue({
      releaseType: "patch",
      reason: "chore",
      commits: [],
    });

    await expect(detectBumpType()).resolves.toBeNull();
  });

  it("returns null when commits is missing", async () => {
    bump.mockResolvedValue({
      releaseType: "patch",
      reason: "chore",
    });

    await expect(detectBumpType()).resolves.toBeNull();
  });

  it("rejects when bump throws", async () => {
    bump.mockRejectedValue(new Error("bump failed"));

    await expect(detectBumpType()).rejects.toThrow("bump failed");
  });
});
