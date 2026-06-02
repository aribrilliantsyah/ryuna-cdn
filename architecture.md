# RyunaCDN — Arsitektur & Rencana Modernisasi

**Author:** aribrilliantsyah
**Basis:** fork dari DADI CDN v4.0.0 (Sep 2019), di-rebrand jadi **RyunaCDN**.
**Tujuan:** modernisasi stack (Node terbaru + pnpm) **tanpa menghilangkan kapabilitas asli**.

## 1. Project ini apa

CDN self-hosted untuk just-in-time image/asset manipulation + delivery. Setara Imgix / Cloudinary lite. Semua fitur asli DADI CDN dipertahankan:

- Image transform on-the-fly (resize, crop, quality, format convert, filter, dll)
- Asset minification (CSS / JS / font passthrough)
- Multi-source storage (disk, S3, remote HTTP)
- Cache layer (disk / Redis) + cron auto-flush
- Multi-domain / multi-tenant
- Workspace: recipes, routes, plugins
- Auth bearer (JWT clientId + secret)
- CloudFront invalidation
- HTTP/2, HTTPS, cluster mode

Endpoint custom yang sudah ditambahkan upstream fork (di `dadi/lib/controller/index.js`):

- `POST /upload_image` — upload image ke `storage/images/` via multer
- `POST /upload_file` — upload asset ke `storage/assets/` via multer
- `DELETE /delete_image` — hapus file dari `storage/images/`
- `DELETE /delete_asset` — hapus file dari `storage/assets/`
- `POST /page_to_pdf` — render URL → PDF via `html-pdf-node`
- `POST /api/flush` — invalidate cache (+ optional CloudFront)
- `POST /api/recipes`, `POST /api/routes` — workspace mgmt
- `GET /(.+)` — main transform pipeline

> Catatan upload: folder tujuan **tidak** dibuat eksplisit. Auto-create implisit terjadi karena `fs-extra.move()` memanggil `mkdirs` ke parent destination. Setelah migrasi lepas dari `fs-extra`, wajib tambahkan `fs.mkdir(parent, {recursive: true})` eksplisit.

## 2. Runtime topology

```
index.js
  └── optional cluster fork (1 worker per CPU)
        └── ryunacdn/lib/index.js  (Server)
              ├── HTTP / HTTPS / HTTP2 listener
              ├── router (npm `router`) + finalhandler + body-parser
              ├── auth middleware (JWT)
              ├── status endpoint
              ├── Controller (controller/index.js)
              │     ├── seek middleware (range request)
              │     ├── upload / delete / pdf routes
              │     └── catch-all GET → HandlerFactory
              ├── HandlerFactory (handlers/factory.js)
              │     ├── ImageHandler  (sharp / jimp / smartcrop / vibrant / imagemin / gifwrap)
              │     ├── CSSHandler    (node-minify + sqwish)
              │     ├── JSHandler     (uglify-js / node-minify)
              │     ├── DefaultHandler (passthrough)
              │     └── PluginHandler  (workspace/plugins/*.js)
              ├── StorageFactory  (storage/factory.js)
              │     ├── DiskStorage  → ./storage/{images,assets}
              │     ├── S3Storage    → aws-sdk v2
              │     └── HTTPStorage  → request / request-promise
              ├── Cache (disk / redis)
              ├── DomainManager (multi-tenant)
              └── Cron (cache flush by schedule)
```

Workspace dirs diload saat boot, di-watch `chokidar`:

- `workspace/recipes/*.json` — preset transform map (SEO-friendly URL)
- `workspace/routes/*.json` — conditional recipe routing (UA, language, domain)
- `workspace/plugins/*.js` — custom handler (duotone, layout)
- `domains/<host>/` — per-domain config override

Config sample: `config/config.{env}.json.sample` → di-copy ke `config.{env}.json` saat boot. Schema di `config.js` pakai `convict`.

## 3. Kenapa install susah sekarang

Banyak package campuran sangat tua + abandoned. Native build gagal di Node 18+. Blocker utama:

| Dep | Pinned | Status | Masalah |
|---|---|---|---|
| `sharp` | ^0.22.0 | EOL | prebuilt binary tidak ada untuk Node ≥18 |
| `jimp` | ^0.6.1 | EOL | API direname di v1, native quirk |
| `aws-sdk` | 2.252.x | maintenance-only | besar, v2 EOL Sep 2025 |
| `cloudfront` | ~0.4.0 | unmaintained 10+ thn | pakai `request`, auth broken |
| `request` / `request-promise` | ~2.88 / ^4 | deprecated 2020 | tidak ada fix untuk Node 18+ TLS |
| `babel-cli`, `babel-core`, `babel-preset-env`, `babel-preset-minify` | 6.x | EOL | tidak dipakai runtime, hanya bloat |
| `mkdirp` | ^0.5 | superseded | `fs.mkdir({recursive})` builtin |
| `fs.extra` | ^1.3 | abandoned | duplikat `fs-extra` |
| `node-minify` | ^3 | superseded | v7+ ada API break |
| `uglify-js` | ^3 | OK untuk ES5 only | pakai `terser` untuk ES2020+ |
| `html-pdf-node` | ^1.0.7 | abandoned | bundle puppeteer/chromium lama |
| `imagemin` + `imagemin-jpegtran` | ^6 | unmaintained | ESM-only fork, sharp bisa gantikan |
| `chokidar` | ^2 | superseded | v4 drop fsevents/glob bundle |
| `multer` | ^1.4.2 | CVE | minimal ≥2.0 |
| `useragent` | 2.3.0 | unmaintained | `ua-parser-js` sudah ada (duplikat) |
| `farmhash` | 2.1.0 | native build | cek pemakaian, kemungkinan bisa drop |
| `colors` | ^1.1.2 | compromised 1.4.44+ | ganti `picocolors` / `kleur` |
| `console-stamp` | ^0.2.2 | API berubah | v3 |
| `convict` | ^4 | superseded | v6 API change |
| `node-vibrant` | ^2.1 | rewrite di v3 | API renamed |
| `exif-reader-paras20xx` | ^1.1 | fork | upstream `exif-reader` v2 OK |
| `gifwrap` | ^0.7 | OK tapi stale | v0.10 |
| `fakeredis` | ^2 | abandoned | `ioredis-mock` |
| `redis` (dev) | ^2 | superseded | v4 promise API |
| `snyk` | runtime dep | tempat salah | pindah ke CI saja |
| `husky` | ^1 | API change | v9 |
| `eslint` | ^6 | EOL | v9 flat config |
| `prettier` | ^1 | major changes | v3 |
| `mocha` + `nyc` | ^5 / ^14 | OK-ish | ganti `vitest` |
| `router` + `finalhandler` + `body-parser` | 1.x / 1.x / 1.x | jalan tapi micro-framework | drop, ganti `fastify` |

Plus: dep `@dadi/*` (boot, logger, cache, status, auth) sudah **fully replaced** dengan module internal di `src/`. Tidak ada satupun `@dadi/*` runtime dep tersisa. Mapping di §5.

## 4. Target stack (pnpm + Node terbaru)

### Runtime
- **Node 22 LTS** (atau 24 current). Pin via `.nvmrc` + `package.json` `engines.node: ">=22"`.
- **pnpm 10** dengan field `packageManager` + `pnpm-lock.yaml`. Pakai `pnpm.overrides` untuk pin transitive.
- ES2022 syntax, top-level `await`, native `fetch`. CommonJS dulu — migrasi ESM jadi PR terpisah.

### HTTP / framework
- **Fastify 5** ganti `router` + `body-parser` + `finalhandler`. Schema validation built-in, hooks, HTTP/2, multipart.
- `@fastify/multipart` untuk upload (ganti `multer`).
- `@fastify/static` kalau perlu static dir.
- `@fastify/cors`, `@fastify/compress` (ganti gzip manual + `compressible`).
- Cluster mode: dua opsi parallel — `node:cluster` built-in (`src/cluster.ts`, dipakai bila `cluster: true` di config) atau **PM2** (`ecosystem.config.cjs`, recommended untuk prod). PM2 cluster mode + internal `cluster: false` supaya tidak dobel fork.

### Image pipeline
- **`sharp` ^0.34** — engine raster utama, libvips ≥ 8.16, full WebP/AVIF/HEIF/JXL.
- Drop `jimp`, `imagemin`, `imagemin-jpegtran` — sharp cover JPEG optimize, GIF, format convert.
- Pertahankan `smartcrop-sharp` ^2.0.7, `node-vibrant` ^3.2 (renamed `@vibrant/node`), `gifwrap` ^0.10.
- `exif-reader` ^2 ganti `exif-reader-paras20xx`.

### Asset minify
- **`terser`** untuk JS (ganti `uglify-js` + `node-minify`).
- **`lightningcss`** untuk CSS (ganti `sqwish` + `node-minify`). Jauh lebih cepat, source map.

### Storage
- **`@aws-sdk/client-s3` v3** (+ `@aws-sdk/lib-storage` untuk multipart upload) ganti `aws-sdk` v2.
- **`@aws-sdk/client-cloudfront` v3** ganti package `cloudfront` abandoned.
- `undici` native fetch ganti `request` / `request-promise` di HTTP storage adapter.

### Cache ✅
- Module internal di `src/cache/` (facade + disk via `cacache` + redis via `ioredis` v5). Tidak pakai wrapper `@dadi/cache` lagi.

### Logging ✅
- `src/logger.ts` pakai `pino` 9 + `pino-pretty` + `createLogger(className)` helper. Replace `@dadi/logger` + `console-stamp` + `colors`.

### Config
- **`convict` ^6** (minor schema change) atau switch ke **`zod`** + `dotenv` (surface lebih kecil).
- Pindahkan secret ke env. Jangan commit sample password/auth secret.

### PDF
- **`puppeteer` ^24** direct + chromium handling sendiri (`@sparticuz/chromium` untuk serverless, atau chromium system). Drop `html-pdf-node`.

### Upload validation
- Ganti `multer` dengan `@fastify/multipart` + MIME sniff (`file-type` v19) — cek extension-only sekarang tidak aman.
- **Wajib**: explicit `fs.mkdir(dest, {recursive: true})` sebelum write/move, karena `fs-extra.move()` auto-mkdir hilang.
- **Wajib**: sanitize `custom_path` (path traversal guard via `path.resolve` + containment check).

### File ops
- `fs/promises` (builtin) cover `mkdirp`, `fs.extra`, sebagian besar `fs-extra`. `fs-extra` v11 dipertahankan kalau shortcut `move`/`copy` masih dipakai luas.

### Misc
- `picocolors` untuk ANSI (ganti `colors`).
- `node:crypto` SHA-1 → drop package `sha1`; SHA-1 OK untuk cache key, atau pakai `xxhash-wasm` lebih cepat (ganti `farmhash`).
- `jsonwebtoken` ^9 (dari ^8 — CVE fixed).
- `mime` ^4 (dari ^2 — ESM, CJS interop OK).

### Tooling
- **Vitest** untuk test (ganti `mocha` + `nyc` + `should` + `proxyquire`). Coverage native via `@vitest/coverage-v8`.
- **`supertest`** masih OK, latest ^7.
- **`biome`** untuk lint+format satu paket (ganti `eslint` + `prettier`). Atau eslint 9 flat config + prettier 3.
- **`husky` ^9** + **`lint-staged` ^15**, atau `simple-git-hooks` (lebih ringan).
- Drop `snyk` dari `dependencies`. Jalanin sebagai GitHub Action saja.
- Hapus semua `babel-*` — Node 22 tidak butuh transpile.

## 5. DADI → RyunaCDN mapping (✅ DONE)

Status: **selesai**. Semua `@dadi/*` runtime dep sudah di-replace.

| Lokasi | Sebelum | Sesudah |
|---|---|---|
| `package.json` `name` | `@dadi/cdn` | `@aribrilliantsyah/ryunacdn` |
| `package.json` `author` | `DADI <team@dadi.tech>` | `aribrilliantsyah` |
| Folder `dadi/lib/` | `dadi/lib/` | `src/` (TypeScript ESM) |
| `@dadi/boot` | upstream banner npm | `src/banner.ts` (ASCII kucing + meta) |
| `@dadi/logger` | upstream pino wrapper | `src/logger.ts` (pino + `createLogger(class)`) |
| `@dadi/cache` | upstream cache wrapper | `src/cache/{index,disk,redis}.ts` (facade + cacache + ioredis) |
| `@dadi/auth` (di-implementasi inline) | upstream JWT helper | `src/auth.ts` (jsonwebtoken HS256 + `/token`) |
| `@dadi/status` | upstream healthcheck | `src/routes/status.ts` (undici probes) |
| `@dadi/eslint-config`, `@dadi/prettier-config` | upstream config | `biome.json` |
| Welcome message | `DAK Content Delivery Network` | `Welcome to RyunaCDN.` |
| Log banner | `dadi/boot` | `src/banner.ts` |
| `README.md` | DADI branding | RyunaCDN branding + credit fork |
| Lisensi | GPL-3.0 inherited | GPL-3.0, NOTICE: © DADI+ Limited + © 2026 aribrilliantsyah |

> **Lisensi**: upstream GPL-3.0. Fork tetap GPL-3.0. `GPL.md` retained. README §License credits upstream DADI.

## 6. Migration phase — status

**Phase 0 — install jalan ✅ DONE**
- `.nvmrc=22`, `engines.node>=22`, `packageManager=pnpm@10`, `type=module`.
- Drop semua dep abandoned: `babel-*`, `fs.extra`, `mkdirp`, `colors`, `console-stamp`, `request`, `request-promise`, `cloudfront` (npm pkg), `useragent`, `fakeredis`, `snyk`, `validate-commit-message`, `farmhash`, `imagemin*`, `node-minify`, `uglify-js`, `sqwish`, `html-pdf-node`, `multer`, `babel-cli`, `router`, `body-parser`, `finalhandler`, `aws-sdk` v2.

**Phase 1 — lib runtime swap ✅ DONE**
- `aws-sdk` v2 → `@aws-sdk/client-s3` v3 (`src/storage/s3.ts`).
- `cloudfront` → `@aws-sdk/client-cloudfront` (`src/routes/flush.ts`).
- `request` / `request-promise` → `undici.fetch` (`src/storage/http.ts`, `src/workspace/route.ts`).
- `html-pdf-node` → `puppeteer` 24 direct (`src/routes/pdf.ts`).
- `imagemin*` → drop, JPEG optimize lewat `sharp.jpeg({mozjpeg:true})` (`src/handlers/image.ts`).
- `node-minify` + `uglify-js` → `terser` (`src/handlers/js.ts`).
- `node-minify` + `sqwish` → `lightningcss` (`src/handlers/css.ts`).
- `multer` → `@fastify/multipart` (`src/routes/upload.ts`).

**Phase 2 — framework swap ✅ DONE**
- `router` + `body-parser` + `finalhandler` → **Fastify 5** (`src/server.ts`).
- Server class jadi `buildServer()` factory dengan plugin (`@fastify/cors`, `@fastify/compress`, `@fastify/multipart`, `@fastify/sensible`).
- Route controller jadi Fastify route per file (`src/routes/*.ts`).
- Manual gzip → `@fastify/compress`.
- `seek` middleware → `src/middleware/range.ts` (port manual, Fastify tidak built-in).

**Phase 3 — test + tooling ⏳ PARTIAL**
- ✅ Biome config.
- ⏳ Vitest config + test cases (belum ditulis).
- ⏳ GitHub Actions workflow.
- ✅ Drop `.travis.yml`.

**Phase 4 — security hardening ✅ DONE**
- Upload endpoint pakai `file-type` MIME sniff (`src/routes/upload.ts`).
- Path traversal **strict** via `safeJoin` (`src/utils/path-safe.ts`): reject `..`, absolute path, null byte, Windows reserved name, length > 255.
- Explicit `fs.mkdir({recursive:true})` sebelum write.
- Auth secret env-only (`AUTH_CLIENT_ID`, `AUTH_SECRET`, `AUTH_KEY`).
- PDF endpoint validasi URL: hanya http(s) accepted, reject `file://` / `data:` (`src/routes/pdf.ts`).
- **Pixel bomb guard** — sharp `limitInputPixels` + post-metadata check (default 100MP). Reject 413.
- **Upload limits eksplisit** — per-file 10MB, max 1 file, max 5 fields (default).
- **Format whitelist** — `?format=bogus` → 400 (bukan silent fallback).
- Rate limit **di-skip** by design (internal forwarder share IP, akan false-positive). Bila perlu, swap ke per-clientId.

**Phase 5 — burst hardening ✅ DONE** (baru)
- **Sharp cap** (`src/runtime-tuning.ts`): `sharp.concurrency(max(1, cpus/4))` per worker + `sharp.cache({memory: 64MB, items: 100})`.
- **Bounded WorkQueue** (`src/middleware/work-queue.ts`): concurrency cap (default 8) + dedup tetap.
- **Request timeout** (`src/server.ts` Fastify opts): `connectionTimeout=60s`, `requestTimeout=120s`, `keepAliveTimeout=5s`. PDF puppeteer internal 60s < outer 120s = aman.
- **Graceful shutdown** (`src/index.ts` + `src/cluster.ts`): SIGTERM/SIGINT → `app.close()` drain ≤ 4s → exit 0. PM2 reload jadi true zero-downtime. Primary forwards `{type:'shutdown'}` via IPC ke semua worker.
- **PM2 ecosystem** (`ecosystem.config.cjs`): `instances:'max'`, `exec_mode:'cluster'`, `autorestart:true`, `max_memory_restart:'1G'`, `kill_timeout:5000`, `listen_timeout:10000`.

**Phase 6 — Web UI ✅ DONE** (baru)
- Landing page `/` (`src/routes/home.ts`) — ASCII banner + features grid + CTA.
- Docs page `/docs` — sticky TOC sidebar, scroll-spy active link, 15 sections.
- Lang switch EN / ID via `?lang=` query.
- Defense in depth no-index: meta tag + `X-Robots-Tag` header global + `robots.txt` deny-all. Internal-only safe.

## 7. Layout sekarang (post-migration)

```
src/
├── index.ts              entry + signal handlers + graceful shutdown
├── cluster.ts            primary/worker fork + IPC shutdown
├── server.ts             Fastify build (HTTPS/HTTP2, CORS, multipart, compress, timeout)
├── banner.ts             ASCII boot logo
├── logger.ts             pino + createLogger(class)
├── auth.ts               JWT + /token
├── cron.ts               cache flush schedule
├── domain-manager.ts     multi-tenant
├── runtime-tuning.ts     boot-time sharp.concurrency + cache cap
├── types.ts / types.d.ts shared TS types
├── config/
│   ├── schema.ts         zod schema (replaces convict)
│   └── index.ts          loader + env overlay + per-domain overrides
├── cache/                index + disk (cacache) + redis (ioredis)
├── storage/              factory + disk + s3 (aws-sdk v3) + http (undici) + missing
├── workspace/            index (chokidar watcher) + recipe + route DSL
├── handlers/             base + factory + image (sharp) + css (lightningcss) + js (terser) + default + plugin
├── middleware/           cache-control + range (seek port) + work-queue (bounded + dedup)
├── routes/               home + upload + delete + pdf + flush + recipes + routes + status + transform + domains + index
│   └── docs-content.ts   structured docs sections × EN/ID
└── utils/                hash + stream + path-safe (strict)
```

Old → New file mapping:

| Old `dadi/lib/*` | New `src/*` |
|---|---|
| `index.js` | `src/index.ts` + `src/cluster.ts` + `src/server.ts` |
| `dadi/lib/index.js` | `src/server.ts` |
| `dadi/lib/controller/index.js` | `src/routes/{upload,delete,pdf,flush,transform}.ts` |
| `dadi/lib/controller/{recipe,route,domain}.js` | `src/routes/{recipes,routes,domains}.ts` |
| `dadi/lib/controller/seek.js` | `src/middleware/range.ts` |
| `dadi/lib/auth/index.js` | `src/auth.ts` |
| `dadi/lib/cache/index.js` | `src/cache/index.ts` (+ disk.ts + redis.ts) |
| `dadi/lib/storage/{factory,disk,s3,http,missing}.js` | `src/storage/{factory,disk,s3,http,missing}.ts` |
| `dadi/lib/handlers/{factory,image,css,js,default,plugin}.js` | `src/handlers/*.ts` |
| `dadi/lib/models/{workspace,recipe,route,domain-manager}.js` | `src/workspace/{index,recipe,route}.ts` + `src/domain-manager.ts` |
| `dadi/lib/workQueue.js` | `src/middleware/work-queue.ts` |
| `dadi/lib/help.js` | `src/utils/{stream,hash}.ts` + Fastify reply built-in |
| `config.js` | `src/config/{schema,index}.ts` |
| `config/config.*.json.sample` | `config/config.example.json` (cuma 1) |
| `index.js` (cluster hack via `restart.cdn`) | `src/cluster.ts` (pakai `node:cluster` built-in) |
| `test/**` (mocha) | TBD (vitest) |
| `.eslintrc` / `.prettierrc` | `biome.json` |
| `.travis.yml` | TBD (`.github/workflows/ci.yml`) |
| `README.md` (DADI) | `README.md` (RyunaCDN + credit fork) |

## 8. Risk note

- ✅ Package `@dadi/*` semua sudah replaced dengan module internal di `src/`. Zero runtime dep ke upstream DADI.
- `sharp` 0.22 → 0.34 — output pixel bisa beda tipis (versi libvips). Bila critical visual parity, run regression test pakai fixture sample.
- HTTP/2 `allowHTTP1` semantic di Node 22 tidak berubah; logic di `src/server.ts` (HTTPS + `enableHTTP2`) compatible.
- Pattern cluster + chokidar restart via file `restart.cdn` (lama) sudah di-drop. Pakai `pm2 reload` atau `node:cluster` direct.
- Schema JSON workspace recipes/routes adalah public API — **jangan ubah shape**. Type di `src/types.ts` (`RecipeFile`, `RouteFile`) match shape lama.

## 9. Kapabilitas asli yang dipertahankan

Daftar fitur yang **wajib tetap jalan** setelah modernisasi:

- [x] Image transform: resize, crop, ratio, quality, format convert (jpg/png/webp/gif/avif), gravity, filter, sharpen, blur, rotate, flip, trim, devicePixelRatio, progressive
- [x] Smart crop (face/feature detection)
- [x] Color extraction (palette via Vibrant)
- [x] EXIF read
- [x] CSS minify + JS minify
- [x] Plugin handler (workspace/plugins)
- [x] Recipe + Route DSL
- [x] Multi-domain config
- [x] Disk + S3 + HTTP storage adapter
- [x] Redis + disk cache adapter
- [x] Cache invalidation API + CloudFront sync
- [x] HTTP/2 + HTTPS + redirect port
- [x] Cluster mode
- [x] Range request (seek)
- [x] gzip compression
- [x] JWT auth
- [x] Status endpoint
- [x] Cron auto-flush
- [x] Upload image / asset
- [x] Delete image / asset
- [x] Page → PDF render

## 10. Production readiness & stress test

Stress test single-deploy (1 process), zero crashes:

| Scenario | rps | p50 | p99 | 5xx | Errors |
|---|---|---|---|---|---|
| Static `/` 100 conn 10s | 5,801 | 15 ms | 44 ms | 0 | 0 |
| Raw image (cached) 100 conn 10s | 6,598 | 13 ms | 41 ms | 0 | 0 |
| Same transform repeated (cache+dedup) | 6,568 | 13 ms | 45 ms | 0 | 0 |
| Unique transforms (CPU-bound, queue-capped) | 105 | 461 ms | 809 ms | 0 | 0 |
| Mixed endpoints 80 conn 12s | 6,201 | 10 ms | 46 ms | 0 | 0 |
| Upload spam 50 × P=20 | — | sub-1s total | — | 0 | 0/50 |
| Graceful shutdown mid-burst | — | — | — | 0 | drain 99ms, exit 0 |

Memory stable ~200 MB RSS sepanjang test. CPU peak 234%, idle 42%.

Security verified:
- Pixel bomb 225MP → 400 (sharp internal limit triggers first)
- Upload 12MB → 413 ("request file too large")
- `?format=bogus` → 400 ("Invalid format ... Allowed: jpg, jpeg, png, webp, avif, gif, json")
- `path=/etc/` → 400 ("absolute path not allowed")
- `path=../etc/` → 400 ("'.' or '..' segment not allowed")
- `path=foo/bar` → 200 (valid)
- PDF `file://` → 400, `data:` → 400 (http(s) only)

## 11. Di luar scope (untuk sekarang)

- Vitest test suite + GitHub Actions CI workflow.
- Dockerfile + docker-compose.
- Log redaction (pino `redact`).
- Health endpoint `/healthz` (skip karena single-node, tidak butuh LB probe).
- Per-IP rate limit (skip — internal forwarder share IP, false-positive).
- Rewrite DSL workspace/recipe (kompat upstream).
- Rewrite auth model (tetap bearer JWT dengan single clientId/secret).
