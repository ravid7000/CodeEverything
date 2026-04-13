---
name: typescript
description: Applies CodeEverything monorepo TypeScript conventions—pnpm workspaces under packages/, @code-everything/* package names, tsconfig.base.json inheritance, React (Vite) vs Node (tsx) package patterns, and workspace imports. Use when editing or adding TypeScript/React code, configuring tsconfig, resolving module or JSX issues, or scaffolding packages in this repository.
---

# TypeScript (CodeEverything)

## Repository layout

- **Root** `tsconfig.json` extends `tsconfig.base.json` and includes `packages/*/src` for editor-wide awareness.
- **Each package** lives under `packages/<name>/` with its own `tsconfig.json` extending `../../tsconfig.base.json` (or `./tsconfig.base.json` at root only).
- **Package names** use the scope `@code-everything/<kebab-case-folder-name>`.

## Base compiler options (`tsconfig.base.json`)

Do not loosen or tighten these for drive-by edits unless the user asks:

| Option | Value | Notes |
|--------|--------|--------|
| `target` | `es5` | Keep aligned with existing code unless migrating deliberately. |
| `module` / `moduleResolution` | `ESNext` / `bundler` | Matches Vite and modern tooling. |
| `jsx` | `react-jsx` | Use automatic JSX runtime; avoid changing to `react` unless required. |
| `strict` | `false` | Existing code is non-strict; new code should still be clear and typed where it helps. |
| `noEmit` | `true` | Typecheck only; builds are Vite or runtime (`tsx`). |
| `isolatedModules` | `true` | Required for Vite/transpile-only workflows. |

## Package kinds

### React (Vite) packages

- **Includes:** `["src"]` only (or as today).
- **Relies on base** `lib` with DOM for browser APIs.
- Entry: `src/main.tsx` + components; Vite resolves paths from package root.
- **Do not** add Node-only `types` unless the package genuinely uses Node APIs in the browser bundle (rare).

### Node / CLI-style packages (`tsx`, scripts, algos)

- **Override** `compilerOptions.lib` to `["ES2015"]` (no DOM) when there is no browser code.
- Set `"types": ["node"]` when using `process`, `Buffer`, etc.
- Keep `include` scoped to `src` (or the folder that holds `.ts` files).

## Workspace imports

- Internal deps use **`workspace:*`** in `package.json` and import by package name, e.g. `@code-everything/stream`, `@code-everything/generators`.
- After adding or renaming packages, **`pnpm install`** at the repo root is required for links.

## New packages

- Prefer **`pnpm create-package`** from the repo root (interactive scaffold for React vs Node). It aligns `package.json`, `tsconfig`, and entry files with existing patterns.
- Match **peer** packages: React apps use the shared `@code-everything/vite-config` and the same React/Vite devDependency versions as sibling apps unless upgrading intentionally.

## Editing guidelines

- **Match** naming, import style, and comment density of neighboring files in the same package.
- **Prefer** explicit types at boundaries (exports, public APIs); avoid large strict-mode refactors in one shot.
- For **tests** (e.g. Vitest), keep environment (`node` vs `jsdom`) consistent with what the test imports.

## Quick checks

- From a package: `pnpm exec tsc -p tsconfig.json` (when `typecheck` exists, use that script).
- After structural changes: ensure root `include` still covers new paths or add a package-level `tsconfig` if the layout is nonstandard.
