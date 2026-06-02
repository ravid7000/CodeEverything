import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';

const initialData = (() => {
  try { return JSON.parse(window.__INITIAL_DATA__ || '{}'); } catch { return {}; }
})();

hydrateRoot(
  document.getElementById('app')!,
  <BrowserRouter>
    <App initialData={initialData} />
  </BrowserRouter>,
);

declare global { interface Window { __INITIAL_DATA__: string } }