import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/server/index.ts",
  },
  outDir: "dist/server",
  format: ["esm"],
  fixedExtension: false,
  sourcemap: true,
  clean: true,
});
