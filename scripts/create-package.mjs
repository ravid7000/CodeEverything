#!/usr/bin/env node
/**
 * Interactive scaffold for new workspace packages under packages/.
 * Usage: pnpm create-package   (from repo root)
 *
 * Non-interactive (e.g. CI): pipe lines — name, type (1|2), [port for React]
 *   printf 'my-app\n1\n5177\n' | pnpm create-package
 */

import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const PACKAGES_DIR = join(REPO_ROOT, "packages");
const SCOPE = "@code-everything";

function nextReactDevPort() {
  let max = 5172;
  if (!existsSync(PACKAGES_DIR)) {
    return 5173;
  }
  for (const name of readdirSync(PACKAGES_DIR)) {
    const viteConfig = join(PACKAGES_DIR, name, "vite.config.ts");
    if (!existsSync(viteConfig)) {
      continue;
    }
    const text = readFileSync(viteConfig, "utf8");
    const m = text.match(/port:\s*(\d+)/);
    if (m) {
      const p = Number(m[1]);
      if (p > max) {
        max = p;
      }
    }
  }
  return max + 1;
}

function validateKebabName(raw) {
  const s = String(raw ?? "").trim().toLowerCase();
  if (!s) {
    return { ok: false, error: "Name cannot be empty." };
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(s)) {
    return {
      ok: false,
      error:
        "Use kebab-case (lowercase letters, digits, single hyphens between segments).",
    };
  }
  return { ok: true, value: s };
}

function titleFromKebab(kebab) {
  return kebab
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * TTY: readline prompts. Non-TTY: read all stdin up front (readline breaks on piped input).
 */
async function createPrompter() {
  if (input.isTTY) {
    const rl = createInterface({ input, output });
    return {
      ask: (prompt) => rl.question(prompt),
      close: () => rl.close(),
    };
  }

  const text = readFileSync(0, "utf8");
  const lines = text.split(/\r?\n/);
  let i = 0;
  return {
    ask: async (prompt) => {
      output.write(prompt);
      const line = lines[i];
      i += 1;
      return line === undefined ? "" : line;
    },
    close: async () => {},
  };
}

async function main() {
  console.log(`Create a new ${SCOPE} package under packages/\n`);

  const prompter = await createPrompter();

  let kebab;
  for (;;) {
    const raw = await prompter.ask(
      "Package folder name (kebab-case, e.g. my-app): "
    );
    const v = validateKebabName(raw);
    if (!v.ok) {
      console.log(v.error);
      continue;
    }
    kebab = v.value;
    const target = join(PACKAGES_DIR, kebab);
    if (existsSync(target)) {
      console.log(`Directory already exists: packages/${kebab}`);
      continue;
    }
    break;
  }

  let kind;
  for (;;) {
    const raw = await prompter.ask(
      "Package type — [1] React (Vite)  [2] Node (tsx) : "
    );
    const t = String(raw ?? "").trim();
    if (t === "1" || /^react$/i.test(t)) {
      kind = "react";
      break;
    }
    if (t === "2" || /^node$/i.test(t) || /^non-?react$/i.test(t)) {
      kind = "node";
      break;
    }
    console.log("Enter 1 for React, or 2 for Node.");
  }

  const pkgJsonName = `${SCOPE}/${kebab}`;
  const rootDir = join(PACKAGES_DIR, kebab);
  const srcDir = join(rootDir, "src");

  mkdirSync(srcDir, { recursive: true });

  if (kind === "react") {
    const suggested = nextReactDevPort();
    const portRaw = await prompter.ask(`Dev server port [${suggested}]: `);
    const port = String(portRaw ?? "").trim()
      ? Number(String(portRaw).trim())
      : suggested;
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      console.error("Invalid port.");
      process.exitCode = 1;
      await prompter.close();
      return;
    }

    const title = titleFromKebab(kebab);

    writeFileSync(
      join(rootDir, "package.json"),
      JSON.stringify(
        {
          name: pkgJsonName,
          private: true,
          type: "module",
          scripts: {
            dev: "vite",
            build: "vite build",
            preview: "vite preview",
          },
          dependencies: {
            react: "^18.2.0",
            "react-dom": "^18.2.0",
          },
          devDependencies: {
            "@code-everything/vite-config": "workspace:*",
            "@types/react": "^18.0.17",
            "@types/react-dom": "^18.0.6",
            "@vitejs/plugin-react": "^4.3.4",
            typescript: "^5.7.3",
            vite: "^6.2.0",
          },
        },
        null,
        2
      ) + "\n"
    );

    writeFileSync(
      join(rootDir, "vite.config.ts"),
      `import { defineConfig, mergeConfig } from "vite";
import { createReactAppConfig } from "@code-everything/vite-config/vite.shared";

export default defineConfig(
  mergeConfig(createReactAppConfig({ port: ${port} }), {})
);
`
    );

    writeFileSync(
      join(rootDir, "tsconfig.json"),
      JSON.stringify(
        {
          extends: "../../tsconfig.base.json",
          include: ["src"],
        },
        null,
        2
      ) + "\n"
    );

    writeFileSync(
      join(rootDir, "index.html"),
      `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`
    );

    writeFileSync(
      join(srcDir, "App.tsx"),
      `export function App() {
  return (
    <div>
      <h1>${title}</h1>
      <p>${pkgJsonName}</p>
    </div>
  );
}
`
    );

    writeFileSync(
      join(srcDir, "main.tsx"),
      `import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

const container = document.getElementById("app");
if (!container) {
  throw new Error('Root element "#app" not found');
}
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`
    );

    console.log(`
Created React package:
  packages/${kebab}/
Dev:
  pnpm --filter ${pkgJsonName} dev
`);
  } else {
    writeFileSync(
      join(rootDir, "package.json"),
      JSON.stringify(
        {
          name: pkgJsonName,
          private: true,
          type: "module",
          scripts: {
            start: "tsx src/index.ts",
            typecheck: "tsc -p tsconfig.json",
          },
          devDependencies: {
            "@types/node": "^18.19.0",
            tsx: "^4.19.0",
            typescript: "^5.7.3",
          },
        },
        null,
        2
      ) + "\n"
    );

    writeFileSync(
      join(rootDir, "tsconfig.json"),
      JSON.stringify(
        {
          extends: "../../tsconfig.base.json",
          compilerOptions: {
            lib: ["ES2015"],
            types: ["node"],
            noEmit: true,
          },
          include: ["src"],
        },
        null,
        2
      ) + "\n"
    );

    writeFileSync(
      join(srcDir, "index.ts"),
      `console.log("Hello from ${pkgJsonName}");
`
    );

    console.log(`
Created Node package:
  packages/${kebab}/
Run:
  pnpm --filter ${pkgJsonName} start
`);
  }

  console.log(`Next: pnpm install
`);
  await prompter.close();
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
