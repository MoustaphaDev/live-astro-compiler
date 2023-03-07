import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // ....
    outputDiffMaxLines: 1000,
    outputDiffLines: 1000,
  },
});
