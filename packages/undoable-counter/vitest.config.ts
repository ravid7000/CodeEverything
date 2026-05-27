import { defineConfig } from "vitest/config";
import { createReactVitestPreset } from "@code-everything/vite-config/vitest.shared";

export default defineConfig(createReactVitestPreset({ environment: "jsdom" }));
