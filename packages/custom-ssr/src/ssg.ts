import fs from 'node:fs';
import path from 'node:path';
import { renderToString } from 'react-dom/server';
import React from 'react';
import { StaticRouter } from 'react-router-dom/server';
import { App } from '../src/App';

const html = renderToString(
  React.createElement(StaticRouter, { location: '/about' }, React.createElement(App))
);
const template = fs.readFileSync(path.resolve('index.html'), 'utf-8');
const out = template
  .replace('<!--ssr-outlet-->', html)
  .replace('<!--ssr-data-->', '{}');

fs.mkdirSync('dist/static', { recursive: true });
fs.writeFileSync('dist/static/about.html', out);
console.log('SSG: wrote dist/static/about.html');