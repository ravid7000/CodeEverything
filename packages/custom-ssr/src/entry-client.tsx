import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import { hydrateIslands } from './islands/hydrate';

const initialData = (() => {
  const raw = window.__INITIAL_DATA__;
  if (raw == null) return {};
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return {}; }
  }
  return raw;
})();

hydrateRoot(
  document.getElementById('app')!,
  <BrowserRouter>
    <App initialData={initialData} />
  </BrowserRouter>,
);

// Partial hydration: only `[data-island]` nodes get their own React roots.
hydrateIslands();

declare global { interface Window { __INITIAL_DATA__: Record<string, unknown> | string } }