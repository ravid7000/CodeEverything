import react from "@vitejs/plugin-react";
import type { UserConfig } from "vite";

export type SharedViteOptions = {
  /** Dev server port (each app should pick a unique port). */
  port?: number;
};

/**
 * Preset for React + Vite apps. Import and merge with `mergeConfig` from `vite` for app-specific overrides.
 */
export function createReactAppConfig(
  options: SharedViteOptions = {}
): UserConfig {
  const port = options.port ?? 5173;
  return {
    plugins: [react()],
    server: { port },
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
  };
}

/**
 * Preset for non-React browser apps (vanilla TS/JS). Use when you add a static or library-style Vite app.
 */
export function createVanillaAppConfig(
  options: SharedViteOptions = {}
): UserConfig {
  const port = options.port ?? 5180;
  return {
    server: { port },
    build: {
      outDir: "dist",
      emptyOutDir: true,
    },
  };
}
