# 00 – Glossary (Abbreviations)

Full expansions for acronyms used across the interview docs (`01`–`14`). Format: **ABBR** — Full Form.

---

## Performance & Web Vitals

| Abbr | Full form |
|---|---|
| **CLS** | Cumulative Layout Shift |
| **FCP** | First Contentful Paint |
| **FID** | First Input Delay (replaced by INP in 2024) |
| **FOIT** | Flash of Invisible Text |
| **FPS** | Frames Per Second |
| **INP** | Interaction to Next Paint |
| **LCP** | Largest Contentful Paint |
| **p75 / p95** | 75th / 95th percentile (latency or metric distribution) |
| **ROI** | Return on Investment |
| **RUM** | Real User Monitoring |
| **TBT** | Total Blocking Time (lab proxy for INP) |
| **TTI** | Time to Interactive |
| **TTFB** | Time to First Byte |

---

## Rendering & delivery

| Abbr          | Full form                                                   |
| ------------- | ----------------------------------------------------------- |
| **CSR**       | Client-Side Rendering                                       |
| **CSS-in-JS** | CSS-in-JavaScript (runtime or build-time styled components) |
| **ISR**       | Incremental Static Regeneration                             |
| **MDX**       | Markdown + JSX                                              |
| **PDP**       | Product Detail Page                                         |
| **RSC**       | React Server Components                                     |
| **SEO**       | Search Engine Optimization                                  |
| **SPA**       | Single Page Application                                     |
| **SSG**       | Static Site Generation                                      |
| **SSR**       | Server-Side Rendering                                       |

---

## Architecture & organization

| Abbr | Full form |
|---|---|
| **A/B** | A/B testing (controlled experiment) |
| **BFF** | Backend for Frontend |
| **DAU** | Daily Active Users |
| **ESI** | Edge Side Includes |
| **FE** | Frontend |
| **MF** | Module Federation |
| **MFE** | Micro-Frontend(s) |
| **MTTR** | Mean Time To Recovery / Repair |
| **OSS** | Open Source Software |
| **SLA** | Service Level Agreement |
| **SSI** | Server Side Includes |
| **UI** | User Interface |
| **UX** | User Experience |

---

## State, data & sync

| Abbr | Full form |
|---|---|
| **CRDT** | Conflict-free Replicated Data Type |
| **GC** | Garbage Collection (also `gcTime` in query cache) |
| **LOC** | Lines of Code |
| **N+1** | N+1 query problem (resolver fetches per row) |
| **OCC** | Optimistic Concurrency Control |
| **OT** | Operational Transformation |
| **RTK** | Redux Toolkit |
| **SWR** | Stale-While-Revalidate (caching pattern; also a library name) |

---

## API, protocols & caching

| Abbr | Full form |
|---|---|
| **CDN** | Content Delivery Network |
| **ETag** | Entity Tag (HTTP cache validator) |
| **GraphQL** | Graph Query Language |
| **HTTP** | Hypertext Transfer Protocol |
| **HTTP/2** | Hypertext Transfer Protocol version 2 |
| **HTTP/3** | Hypertext Transfer Protocol version 3 |
| **JWT** | JSON Web Token |
| **REST** | Representational State Transfer |
| **RPC** | Remote Procedure Call |
| **SDL** | Schema Definition Language (GraphQL) |
| **SSE** | Server-Sent Events |
| **SW** | Service Worker |
| **tRPC** | TypeScript Remote Procedure Call |
| **TTL** | Time To Live |

---

## Observability & monitoring

| Abbr       | Full form                                 |
| ---------- | ----------------------------------------- |
| **DSN**    | Data Source Name (Sentry ingest endpoint) |
| **NEL**    | Network Error Logging                     |
| **OTel**   | OpenTelemetry                             |
| **PII**    | Personally Identifiable Information       |
| **StatsD** | Statistics Daemon (metrics protocol)      |
| **MSW**    | Mock Service Worker                       |

---

## CI/CD, deployment & tooling

| Abbr | Full form |
|---|---|
| **CI/CD** | Continuous Integration / Continuous Deployment (or Delivery) |
| **CycloneDX** | CycloneDX (SBOM standard/format) |
| **E2E** | End-to-End (testing) |
| **GTM** | Google Tag Manager |
| **KV** | Key-Value (store, e.g. feature-flag backend) |
| **LHCI** | Lighthouse CI |
| **SBOM** | Software Bill of Materials |
| **SHA** | Secure Hash Algorithm (e.g. `GIT_SHA` release tag) |
| **S3** | Amazon Simple Storage Service |

---

## Security & compliance

| Abbr | Full form |
|---|---|
| **PCI** | Payment Card Industry (PCI DSS compliance) |

---

## File formats, modules & platform APIs

| Abbr | Full form |
|---|---|
| **ARIA** | Accessible Rich Internet Applications |
| **AVIF** | AV1 Image File Format |
| **CJS** | CommonJS |
| **DOM** | Document Object Model |
| **ESM** | ECMAScript Modules |
| **i18n** | Internationalization |
| **ICU** | International Components for Unicode |
| **JPEG** | Joint Photographic Experts Group |
| **SVG** | Scalable Vector Graphics |
| **WAI-ARIA** | Web Accessibility Initiative – ARIA |
| **WebGL** | Web Graphics Library |
| **WebGPU** | Web GPU API |
| **WebP** | Web Picture format |

---

## Hardware / runtime

| Abbr | Full form |
|---|---|
| **CPU** | Central Processing Unit |
| **GPU** | Graphics Processing Unit |

---

## Common terms (expanded for clarity)

| Term | Full form / meaning |
|---|---|
| **JS** | JavaScript |
| **CSS** | Cascading Style Sheets |
| **HTML** | HyperText Markup Language |
| **API** | Application Programming Interface |
| **PR** | Pull Request |
| **npm** | Node Package Manager (recursive acronym: “npm is not an acronym”) |
| **rAF** | `requestAnimationFrame` (browser API, not always written out) |

---

## Quick lookup by doc

| Doc | Key abbreviations |
|---|---|
| 01 | CSR, SSR, SSG, ISR, TTFB, FCP, TTI, SEO, PDP, CDN |
| 02 | SSR, RSC, SPA, FCP, LCP, TTI, CSS-in-JS, MDX |
| 03 | UI, ARIA, WAI-ARIA |
| 04 | RTK, SWR, GC |
| 05 | REST, GraphQL, tRPC, SW, TTL, ETag, JWT, SDL, BFF, MSW, OCC, SWR |
| 06 | MF, MFE, SSI, ESI, ESM, CJS, SVG, DOM, SEO |
| 07 | MFE, SSR, SEO, E2E, OSS |
| 08 | LCP, INP, CLS, FCP, TTFB, TBT, TTI, FID, RUM, ROI, RSC, SSR, SSG, ISR, CDN, GTM, CI/CD, FPS, GPU, CPU, DOM, CRDT, RPC, FOIT, AVIF, WebP, JPEG, ICU |
| 09 | RUM, FE, OTel, PII, DSN, StatsD, LCP, INP, CLS, TTFB, FCP, SHA, NEL |
| 10 | CI/CD, CDN, TTL, SBOM, CycloneDX, SHA, KV, S3, LHCI |
| 11 | DAU, SLA, MFE, MF, BFF, SSR, CSR, SSG, SEO, CRDT, OT, SSE, PCI, i18n, ICU, WebGL, LCP, RUM, A/B |
| 12 | SSR, SSG, CSR, CDN |
| 13 | LOC, GC, SWR |
| 14 | (cross-cutting — see sections above) |
