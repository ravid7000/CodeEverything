# All in one repo for coding, experiments, and interview prep

## Apps (Vite + React)

Each app is a package under `packages/` with its own dev server and `index.html`.

| Package | Dev command | Port |
| --- | --- | --- |
| Kanban board | `pnpm --filter @code-everything/kanban-board dev` | 5173 |
| Tic tac toe | `pnpm --filter @code-everything/tic-tac-toe dev` | 5174 |
| Atlassian tree | `pnpm --filter @code-everything/atlassian-tree dev` | 5175 |
| Analytics | `pnpm --filter @code-everything/analytics dev` | 5176 |

Shared Vite presets live in `packages/vite-config` (`createReactAppConfig` / `createVanillaAppConfig`).

## Node / CLI-style packages

TypeScript scripts under `packages/algos`, `packages/design-patterns`, `packages/hello-world`, etc. Run with `tsx`, for example:

`pnpm --filter @code-everything/algos exec tsx src/fibonacci.ts`

## New package (scaffold)

From the repo root:

```sh
pnpm create-package
```

You will be prompted for a **kebab-case** folder name and **React (Vite)** vs **Node (tsx)**. For React, the script suggests the next free dev server port after existing Vite apps.

Non-interactive (three lines: name, `1` or `2`, optional port for React — empty line uses the suggested port):

```sh
printf 'my-app\n1\n\n' | pnpm create-package
```

## Installation

```sh
pnpm install
```
