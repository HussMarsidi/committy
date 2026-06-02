import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/e2e/**/*.test.ts"],
    testTimeout: 15_000, // subprocess tests need more headroom
    hookTimeout: 10_000,
  },
});
