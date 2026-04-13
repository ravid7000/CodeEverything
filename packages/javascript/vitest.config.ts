import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.{test,spec}.ts", "src/**/__tests__/**/*.ts"],
    passWithNoTests: true,
  },
});
