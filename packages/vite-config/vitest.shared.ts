import type { UserConfig } from "vitest/config";

export type ReactVitestOptions = {
  /**
   * `jsdom` — default for React (components, DOM). Install `jsdom` in the package devDependencies.
   * `node` — fast, for pure logic / stores with no DOM.
   */
  environment?: "jsdom" | "node" | "happy-dom";
  /** If set, replaces default `include` globs */
  include?: string[];
  passWithNoTests?: boolean;
};

const defaultReactInclude = [
  "src/**/*.{test,spec}.{ts,tsx}",
  "src/**/__tests__/**/*.{ts,tsx}",
];

/**
 * Vitest layer for **Vite + React** packages. Merge with `mergeConfig` from `vite` and `defineConfig` from `vitest/config`.
 *
 * Default environment is `jsdom` (add devDependency `jsdom`). Use `{ environment: "node" }` for logic-only tests.
 */
export function createReactVitestPreset(
  options: ReactVitestOptions = {}
): UserConfig {
  const env = options.environment ?? "jsdom";
  const include =
    options.include !== undefined ? options.include : defaultReactInclude;

  return {
    test: {
      globals: true,
      environment: env,
      include,
      passWithNoTests: options.passWithNoTests ?? false,
    },
  };
}

export type NodeVitestOptions = {
  include?: string[];
  passWithNoTests?: boolean;
};

const defaultNodeInclude = [
  "src/**/*.{test,spec}.ts",
  "src/**/__tests__/**/*.ts",
];

/**
 * Vitest config for **Node / non-Vite** packages (or `vitest.config.ts` at package root).
 * Use `defineConfig(...)` from `vitest/config` as the default export.
 */
export function createNodeVitestPreset(
  options: NodeVitestOptions = {}
): UserConfig {
  const include =
    options.include !== undefined ? options.include : defaultNodeInclude;

  return {
    test: {
      globals: true,
      environment: "node",
      include,
      passWithNoTests: options.passWithNoTests ?? false,
    },
  };
}
