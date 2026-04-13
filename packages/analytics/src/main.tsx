import React from "react";
import { createRoot } from "react-dom/client";
import { AnalyticsApp } from "./index";

const container = document.getElementById("app");
if (!container) {
  throw new Error('Root element "#app" not found');
}
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <AnalyticsApp />
  </React.StrictMode>
);
