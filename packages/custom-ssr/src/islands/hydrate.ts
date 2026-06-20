import React from 'react';
import { createRoot } from 'react-dom/client';
import { Counter } from './Counter';

const registry: Record<string, React.ComponentType<any>> = {
  Counter,
};

export function hydrateIslands() {
  document.querySelectorAll<HTMLElement>('[data-island]:not([data-island-mounted])').forEach(el => {
    const name = el.dataset.island;
    if (!name || !registry[name]) {
      console.warn(`Unknown island: ${name ?? '(missing name)'}`);
      return;
    }

    let props: Record<string, unknown> = {};
    try {
      props = JSON.parse(el.dataset.props ?? '{}');
    } catch {
      console.warn(`Invalid data-props on island "${name}"`);
    }

    el.dataset.islandMounted = 'true';
    const Island = registry[name];
    createRoot(el).render(React.createElement(Island, props));
  });
}
