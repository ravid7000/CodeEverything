import { defineConfig, mergeConfig } from "vite";
import { createReactAppConfig } from "@code-everything/vite-config/vite.shared";

export default defineConfig(
  mergeConfig(createReactAppConfig({ port: 5181 }, {
    server: { port: 5181, middlewareMode: false },
    ssr: { noExternal: ['react-router-dom', 'react-router'] },
  }), {})
);
