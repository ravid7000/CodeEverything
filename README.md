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

## Installation

```sh
pnpm install
```
