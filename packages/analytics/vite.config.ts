import { defineConfig, mergeConfig } from "vite";
import { createReactAppConfig } from "@code-everything/vite-config/vite.shared";

export default defineConfig(
  mergeConfig(createReactAppConfig({ port: 5176 }), {})
);
