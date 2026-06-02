import React from "react";
import { renderToPipeableStream } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { App } from "./App";

export function render(url: string, initialData: unknown, callbacks: {
  onShellReady: () => void;
  onAllReady: () => void;
  onError: (e: unknown) => void;
}) {
  return renderToPipeableStream(
    <StaticRouter location={url}>
      <App initialData={initialData} />
    </StaticRouter>,
    {
      bootstrapModules: ['/src/entry-client.tsx'],
      onShellReady: callbacks.onShellReady,
      onAllReady: callbacks.onAllReady,
      onError: callbacks.onError,
    },
  );
}