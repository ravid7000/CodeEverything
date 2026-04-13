import { mergeConfig } from "vite";
import { defineConfig } from "vitest/config";
import { createReactAppConfig } from "@code-everything/vite-config/vite.shared";
import { createReactVitestPreset } from "@code-everything/vite-config/vitest.shared";

export default mergeConfig(
  createReactAppConfig({ port: 5174 }),
  defineConfig(
    createReactVitestPreset({
      environment: "node",
      include: ["src/**/__tests__/**/*.ts"],
    })
  )
);
