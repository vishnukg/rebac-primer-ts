import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      exclude: [
        "**/index.ts",
        "**/testFixtures.ts",
        "**/types.ts",
        "src/app/core/ports/**",
        "src/server/**",
      ],
    },
  },
});
