import { mergeConfig } from "vite";
import { defineConfig } from "vitest/config";
import { createReactAppConfig } from "@code-everything/vite-config/vite.shared";

export default mergeConfig(
  createReactAppConfig({ port: 5174 }),
  defineConfig({
    test: {
      globals: true,
      environment: "node",
      include: ["src/**/__tests__/**/*.ts"],
    },
  })
);
