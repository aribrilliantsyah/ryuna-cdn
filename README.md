```
   ╱|、
  (˚ˎ 。7        RyunaCDN
   |、˜〵         by aribrilliantsyah
   じしˍ,)ノ
```

# RyunaCDN

**Just-in-time image & asset CDN.** Modern TypeScript fork of [DADI CDN](https://github.com/dadi/cdn).

[![Node](https://img.shields.io/badge/node-22%2B-43853d?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178c6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Fastify](https://img.shields.io/badge/Fastify-5-000?style=flat-square&logo=fastify&logoColor=white)](https://fastify.dev)
[![sharp](https://img.shields.io/badge/sharp-0.34-99cc00?style=flat-square)](https://sharp.pixelplumbing.com)
[![PM2](https://img.shields.io/badge/PM2-cluster-2b037a?style=flat-square&logo=pm2&logoColor=white)](https://pm2.keymetrics.io)
[![License](https://img.shields.io/badge/license-GPL--3.0-blue?style=flat-square)](./GPL.md)

---

## 🐾 What it does

Image transforms on the fly, asset minify, multi-source storage, cache, multi-domain, recipes, routes, plugins, JWT auth, upload, PDF generation — everything DADI CDN did, **rewritten lean** in modern TypeScript.

| Feature | Detail |
|---|---|
| 🖼️ **Image transform** | resize, crop, ratio, format (JPEG / PNG / WebP / AVIF / GIF), quality, gravity, smartcrop entropy, blur, sharpen, rotate, flip, devicePixelRatio |
| 📦 **Asset minify** | CSS via `lightningcss`, JS via `terser` — cached, source maps |
| ☁️ **Storage** | disk, S3 (+ DigitalOcean Spaces / MinIO / R2), remote HTTP |
| ⚡ **Cache** | disk (`cacache`) or Redis (`ioredis`), cron auto-flush, `POST /api/flush`, CloudFront sync |
| 🌐 **Multi-domain** | per-host config overrides |
| 📐 **Workspace** | recipes (preset URL→transform), routes (conditional recipe by device/lang/geo/network), plugins (custom JS handler) |
| 🔐 **Auth** | JWT bearer (HS256) on `/api/*`, env-only secret |
| 📤 **Upload** | multipart `image` / `asset` with MIME sniff + path traversal guard |
| 📄 **PDF** | URL → PDF via Puppeteer (Chromium headless) |
| 🚀 **Cluster** | `node:cluster` built-in or PM2 cluster (recommended) |
| 📊 **Observability** | `pino` structured logs with `[Class]` prefix, ASCII boot banner |
| 🌍 **Web UI** | `/` landing + `/docs` (EN / ID) with sticky TOC |

## 🧱 Stack

| Layer | Library |
|---|---|
| Runtime | Node 22+ · pnpm 10 · TypeScript 5.7 · ESM |
| HTTP | [Fastify 5](https://fastify.dev) + multipart + compress + cors + sensible |
| Image | [`sharp` 0.34](https://sharp.pixelplumbing.com) + smartcrop + node-vibrant + gifwrap |
| Minify | `terser` (JS) · `lightningcss` (CSS) |
| Storage | `@aws-sdk/client-s3` v3 · `undici` (HTTP) · `fs/promises` (disk) |
| Cache | `ioredis` 5 · `cacache` |
| PDF | `puppeteer` 24 |
| Auth | `jsonwebtoken` 9 |
| Logging | `pino` 9 + `pino-pretty` |
| Config | `zod` schema + env overlay |
| Lint/Format | `biome` |
| Tests | `vitest` |
| Process | `pm2` cluster |

## 🚀 Quick start

```bash
# 1. Install
nvm use 22
pnpm install

# 2. (optional) per-env config
cp config/config.example.json config/config.development.json

# 3. (optional) secrets
cp .env.example .env
# edit .env

# 4. Run
pnpm dev          # tsx watch (hot reload, no build)
# OR
pnpm prod         # build + PM2 cluster
```

Visit `http://localhost:8080` for the landing page, `http://localhost:8080/docs` for full docs (with EN / ID toggle).

## 📜 Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Dev watch (tsx hot reload, no build) |
| `pnpm build` | Compile TS → `dist/` |
| `pnpm start` | Run single process from `dist/` |
| `pnpm prod` | Build + start PM2 cluster (1 worker / CPU) |
| `pnpm prod:status` | PM2 process table |
| `pnpm prod:logs` | Tail PM2 logs |
| `pnpm prod:restart` | Zero-downtime reload |
| `pnpm prod:stop` | Stop PM2 cluster |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | Biome check + autofix |
| `pnpm format` | Biome format |
| `pnpm test` | Vitest run |

## ⚙️ Configuration

**Two layers, merged at boot. Env always wins.**

### Layer 1 — `config/config.{NODE_ENV}.json` (optional, non-secret)
Non-secret runtime tunables (cache TTL, image limits, header rules, cron). If missing, zod defaults apply. Pick env via `NODE_ENV` (`development` by default). See [`config/config.example.json`](./config/config.example.json).

### Layer 2 — `.env` (secrets + per-deploy)
28 documented variables. See [`.env.example`](./.env.example) for the full list. Key groups:

| Group | Vars |
|---|---|
| Runtime | `NODE_ENV`, `PORT`, `HOST`, `PROTOCOL`, `RYUNACDN_NO_BANNER` |
| Auth (required for `/api/*`) | `AUTH_CLIENT_ID`, `AUTH_SECRET`, `AUTH_KEY` |
| Cache | `CACHE_ENABLE_*`, `REDIS_*` |
| S3 (images / assets) | `AWS_S3_IMAGES_*`, `AWS_S3_ASSETS_*` |
| CloudFront | `CLOUDFRONT_*` |
| **Tuning** (burst stability) | `SHARP_CONCURRENCY`, `SHARP_CACHE_*`, `RYUNACDN_QUEUE_CONCURRENCY`, `RYUNACDN_*_TIMEOUT_MS`, `RYUNACDN_SHUTDOWN_TIMEOUT_MS` |
| **Security** | `RYUNACDN_MAX_MEGAPIXELS`, `RYUNACDN_UPLOAD_MAX_BYTES`, `RYUNACDN_UPLOAD_MAX_FILES`, `RYUNACDN_UPLOAD_MAX_FIELDS` |

**Rule of thumb:** secrets → env. Non-secret tunables → config file.

## 🛣️ Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/` | Landing page (HTML) |
| GET | `/docs` | Full docs (`?lang=en` / `?lang=id`) |
| GET | `/robots.txt` | Deny all crawlers (internal default) |
| GET | `/<file>` | Serve / transform image or asset |
| GET | `/<recipe>/<file>` | Apply recipe preset |
| GET | `/<route>/<file>` | Apply conditional route → recipe |
| POST | `/upload_image` | Multipart `image` + optional `path` |
| POST | `/upload_file` | Multipart `asset` + optional `path` |
| DELETE | `/delete_image` | JSON `{ filename, path? }` |
| DELETE | `/delete_asset` | JSON `{ filename, path? }` |
| POST | `/page_to_pdf` | JSON `{ url, format?, landscape?, filename }` |
| POST | `/token` | JSON `{ clientId, secret }` → JWT |
| POST | `/api/flush` | JSON `{ pattern }` 🔒 |
| POST | `/api/recipes` | Define recipe 🔒 |
| POST | `/api/routes` | Define route 🔒 |
| POST | `/api/status` | Health probe 🔒 |

🔒 = requires `Authorization: Bearer <token>`

## 🎛️ Image params quick reference

```
?width=600&height=400        explicit size
?ratio=16-9                  aspect ratio
?format=webp,jpg             WebP if Accept supports, else JPEG
?quality=80                  1-100
?resize=aspectfit            aspectfit | aspectfill | fill | crop | entropy
?gravity=Center              NW|N|NE|W|C|E|SW|S|SE|None
?dpr=2                       device pixel ratio
?blur=5&sharpen=1&rotate=90  effects
?flip=x                      x | y | xy
?crop=10,10,300,200          top,left,bottom,right
?format=json                 returns metadata + palette
```

Full reference + examples at `/docs`.

## 📁 Project layout

```
.
├── src/                     Source (TypeScript ESM)
│   ├── index.ts             entry + signal handlers
│   ├── cluster.ts           primary/worker fork
│   ├── server.ts            Fastify build (HTTPS/HTTP2, CORS, multipart, compress)
│   ├── banner.ts            ASCII boot logo
│   ├── logger.ts            pino + createLogger(class) helper
│   ├── auth.ts              JWT middleware + /token
│   ├── cron.ts              cache flush schedule
│   ├── domain-manager.ts    multi-tenant
│   ├── runtime-tuning.ts    sharp.concurrency + cache cap at boot
│   ├── config/              zod schema + loader + env overlay
│   ├── cache/               { index, disk (cacache), redis (ioredis) }
│   ├── storage/             { factory, disk, s3, http, missing }
│   ├── workspace/           { index (chokidar), recipe, route DSL }
│   ├── handlers/            { factory, image (sharp), css, js, default, plugin }
│   ├── middleware/          { cache-control, range (seek), work-queue (bounded) }
│   ├── routes/              { home, upload, delete, pdf, flush, recipes, routes, status, transform, domains }
│   └── utils/               { hash, stream, path-safe }
├── config/
│   └── config.example.json  copy → config.{env}.json (optional)
├── examples/
│   ├── plugins/             reference custom handlers
│   └── recipes/             reference recipe JSON
├── ecosystem.config.cjs     PM2 cluster config
├── architecture.md          design + migration record
├── package.json
└── tsconfig.json
```

**Runtime-created (gitignored):** `cache/`, `storage/`, `workspace/`, `domains/`, `log/`, `dist/`.

## 🪵 Logging

```
[YYYY-MM-DD HH:MM:SS.lll] LEVEL: [Class] message
```

- Date+time + level: plain (no emoji)
- Class prefix in cyan brackets
- Emoji used sparingly in messages only (🚀 boot, ✅ 2xx, ⚠️ 4xx, 💥 5xx, 🐾 worker, 🧬 cluster fork, ☠️ worker die, 🔄 cache flush, 🛑 shutdown, 👋 done)
- `RYUNACDN_NO_BANNER=true` hides boot banner

## 🛡️ Security & burst hardening

| Layer | Status |
|---|---|
| Strict path (block `..`, absolute, null byte, Windows reserved, 255 char cap) | ✅ |
| MIME sniff via `file-type` (not just extension) | ✅ |
| Pixel bomb guard (`sharp.limitInputPixels` + post-check, default 100MP) | ✅ |
| Upload per-file cap (10 MB default), max 1 file + 5 fields | ✅ |
| Format whitelist (`?format=bogus` → 400) | ✅ |
| PDF SSRF block (`http(s)` only, no `file://` / `data:`) | ✅ |
| JWT bearer on `/api/*`, secret env-only | ✅ |
| `X-Robots-Tag: noindex, nofollow` global + `robots.txt` deny-all | ✅ |
| Sharp thread cap (`sharp.concurrency(N)`) | ✅ |
| Sharp memory cache cap (`SHARP_CACHE_MEMORY_MB=64`) | ✅ |
| Bounded WorkQueue (`RYUNACDN_QUEUE_CONCURRENCY=8`) | ✅ |
| Request timeout (`requestTimeout=120s`, `connectionTimeout=60s`) | ✅ |
| Graceful SIGTERM shutdown (4s drain, then force exit) | ✅ |
| PM2 `max_memory_restart: 1G` + auto-restart on crash | ✅ |

## 📊 Stress test (single deploy, 1 process)

| Scenario | rps | p50 | p99 | 5xx |
|---|---|---|---|---|
| Static `/` | 5,801 | 15 ms | 44 ms | 0 |
| Raw image (cached) | 6,598 | 13 ms | 41 ms | 0 |
| Repeated transform (cache+dedup) | 6,568 | 13 ms | 45 ms | 0 |
| Unique transforms (CPU bound) | 105 | 461 ms | 809 ms | 0 |
| Mixed endpoints | 6,201 | 10 ms | 46 ms | 0 |
| Upload spam (50 × P=20) | — | — | — | 0/50 |
| Graceful shutdown mid-burst | 99 ms drain | exit 0 | 25k 2xx | 0 |

Zero crashes, zero timeouts. Memory stable at ~200 MB RSS.

## 🪪 License

GPL-3.0-or-later. See [`GPL.md`](./GPL.md).

Originally derived from [DADI CDN](https://github.com/dadi/cdn) © DADI+ Limited. Modifications © 2026 [aribrilliantsyah](https://github.com/aribrilliantsyah).

---

<sub>Built with 🐾 by <a href="https://github.com/aribrilliantsyah">aribrilliantsyah</a> · <a href="./architecture.md">architecture.md</a> · <a href="/docs">/docs</a></sub>
