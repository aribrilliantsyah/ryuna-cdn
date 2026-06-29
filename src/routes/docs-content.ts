export type Lang = 'en' | 'id'

export interface Section {
  id: string
  title: Record<Lang, string>
  body: Record<Lang, string>
}

const escape = (s: string): string => s

// Bodies are HTML strings. Code blocks use <pre><code>. Each section is
// listed in the table of contents.
export const sections: Section[] = [
  {
    id: 'prerequisites',
    title: { en: 'Prerequisites', id: 'Prasyarat' },
    body: {
      en: escape(`
<p>Install these on your machine before continuing.</p>
<table>
  <thead><tr><th>Tool</th><th>Min version</th><th>Notes</th></tr></thead>
  <tbody>
    <tr><td><code>node</code></td><td>22 LTS</td><td>Install via <code>nvm</code>. ESM strict.</td></tr>
    <tr><td><code>pnpm</code></td><td>10.x</td><td><code>npm i -g pnpm</code> or <code>corepack enable</code></td></tr>
    <tr><td><code>git</code></td><td>any recent</td><td>For cloning + GPL distribution</td></tr>
    <tr><td><code>libvips</code></td><td>≥ 8.16</td><td>For <code>sharp</code> on Linux. Prebuilts cover most cases.</td></tr>
    <tr><td><code>chromium</code></td><td>any</td><td>Pulled in by Puppeteer automatically.</td></tr>
  </tbody>
</table>
<h3>Install Node via nvm</h3>
<pre><code># Linux / macOS
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
exec $SHELL
nvm install 22
nvm use 22

# Windows: use nvm-windows
# https://github.com/coreybutler/nvm-windows/releases</code></pre>
<h3>Install pnpm</h3>
<pre><code>corepack enable
corepack prepare pnpm@10 --activate
# OR
npm i -g pnpm</code></pre>
<h3>System packages (Linux)</h3>
<pre><code># Debian / Ubuntu
sudo apt-get install -y build-essential git
# Sharp prebuilt covers libvips. If building from source:
sudo apt-get install -y libvips-dev

# Arch
sudo pacman -S base-devel git
# Sharp prebuilt OK; for build: libvips

# Puppeteer needs Chromium runtime libs (auto-installed first run)
# Manual install if firewall blocks the download:
# https://pptr.dev/troubleshooting</code></pre>
<h3>macOS</h3>
<pre><code>xcode-select --install
brew install git
# nvm via brew is OK too: brew install nvm</code></pre>
<h3>Verify</h3>
<pre><code>node --version    # v22.x
pnpm --version    # 10.x
git --version</code></pre>
`),
      id: escape(`
<p>Pasang dulu sebelum lanjut.</p>
<table>
  <thead><tr><th>Tool</th><th>Versi minimum</th><th>Catatan</th></tr></thead>
  <tbody>
    <tr><td><code>node</code></td><td>22 LTS</td><td>Pakai <code>nvm</code>. ESM strict.</td></tr>
    <tr><td><code>pnpm</code></td><td>10.x</td><td><code>npm i -g pnpm</code> atau <code>corepack enable</code></td></tr>
    <tr><td><code>git</code></td><td>versi terbaru</td><td>Untuk clone + distribusi GPL</td></tr>
    <tr><td><code>libvips</code></td><td>≥ 8.16</td><td>Untuk <code>sharp</code> di Linux. Biasanya prebuilt cukup.</td></tr>
    <tr><td><code>chromium</code></td><td>any</td><td>Otomatis ditarik oleh Puppeteer.</td></tr>
  </tbody>
</table>
<h3>Install Node via nvm</h3>
<pre><code># Linux / macOS
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
exec $SHELL
nvm install 22
nvm use 22

# Windows: pakai nvm-windows
# https://github.com/coreybutler/nvm-windows/releases</code></pre>
<h3>Install pnpm</h3>
<pre><code>corepack enable
corepack prepare pnpm@10 --activate
# ATAU
npm i -g pnpm</code></pre>
<h3>Paket sistem (Linux)</h3>
<pre><code># Debian / Ubuntu
sudo apt-get install -y build-essential git
# Sharp prebuilt sudah cover libvips. Kalau perlu build manual:
sudo apt-get install -y libvips-dev

# Arch
sudo pacman -S base-devel git

# Puppeteer butuh runtime Chromium (auto-download saat first run)
# Kalau firewall block, install manual:
# https://pptr.dev/troubleshooting</code></pre>
<h3>macOS</h3>
<pre><code>xcode-select --install
brew install git
# nvm via brew juga OK: brew install nvm</code></pre>
<h3>Cek versi</h3>
<pre><code>node --version    # v22.x
pnpm --version    # 10.x
git --version</code></pre>
`)
    }
  },
  {
    id: 'installation',
    title: { en: 'Installation', id: 'Instalasi' },
    body: {
      en: `
<pre><code>git clone https://github.com/aribrilliantsyah/ryuna-cdn.git
cd ryuna-cdn
nvm use 22
pnpm install</code></pre>
<p>Install pulls native modules (<code>sharp</code>, <code>puppeteer</code>) — first install may take 1–3 minutes.</p>
<h3>Build &amp; first run</h3>
<pre><code># development (hot reload, no build)
pnpm dev

# OR build then run
pnpm build
pnpm start</code></pre>
<p>Default URL: <code>http://0.0.0.0:8080</code> (or whatever <code>PORT</code> you set).</p>
<h3>What gets auto-created at first boot</h3>
<ul>
  <li><code>workspace/recipes/</code>, <code>workspace/routes/</code>, <code>workspace/plugins/</code> — empty</li>
  <li><code>cache/</code> — disk cache (when caching.directory enabled)</li>
  <li><code>storage/images/</code>, <code>storage/assets/</code> — appear on first upload</li>
</ul>`,
      id: `
<pre><code>git clone https://github.com/aribrilliantsyah/ryuna-cdn.git
cd ryuna-cdn
nvm use 22
pnpm install</code></pre>
<p>Install bakal ngambil native module (<code>sharp</code>, <code>puppeteer</code>) — pertama kali biasanya 1–3 menit.</p>
<h3>Build &amp; pertama jalan</h3>
<pre><code># development (hot reload, tanpa build)
pnpm dev

# ATAU build dulu lalu run
pnpm build
pnpm start</code></pre>
<p>URL default: <code>http://0.0.0.0:8080</code> (atau sesuai <code>PORT</code> yang kamu set).</p>
<h3>Folder yang otomatis dibuat saat boot pertama</h3>
<ul>
  <li><code>workspace/recipes/</code>, <code>workspace/routes/</code>, <code>workspace/plugins/</code> — kosong</li>
  <li><code>cache/</code> — disk cache (kalau caching.directory aktif)</li>
  <li><code>storage/images/</code>, <code>storage/assets/</code> — muncul saat upload pertama</li>
</ul>`
    }
  },
  {
    id: 'configuration',
    title: { en: 'Configuration', id: 'Konfigurasi' },
    body: {
      en: `
<p>Three layers, merged at boot (later wins):</p>
<ol>
  <li><strong>zod defaults</strong> — built-in, always applied.</li>
  <li><strong>JSON file</strong> at <code>config/config.{NODE_ENV}.json</code> — optional, non-secret tunables.</li>
  <li><strong>Env vars</strong> from <code>.env</code> or shell — secrets + per-deploy overrides.</li>
</ol>
<p>You may omit the JSON file entirely (defaults + env are enough), or override only the keys you care about.</p>

<h3>Layer 2 — JSON config per environment</h3>
<p>File picked by <code>NODE_ENV</code>:</p>
<table>
  <thead><tr><th><code>NODE_ENV</code></th><th>File loaded</th></tr></thead>
  <tbody>
    <tr><td><code>development</code> (default)</td><td><code>config/config.development.json</code></td></tr>
    <tr><td><code>production</code></td><td><code>config/config.production.json</code></td></tr>
    <tr><td><code>qa</code></td><td><code>config/config.qa.json</code></td></tr>
    <tr><td><code>test</code></td><td><code>config/config.test.json</code></td></tr>
  </tbody>
</table>

<h3>Quick setup</h3>
<pre><code># 1. Copy the example
cp config/config.example.json config/config.development.json

# 2. Edit only what differs from defaults — chokidar watches the file and reloads on save</code></pre>

<h3>Partial override (recommended)</h3>
<p>No need to copy the whole example. Override only what matters:</p>
<pre><code>// config/config.development.json — minimal
{
  "server": { "port": 9000 },
  "caching": { "ttl": 60 }
}</code></pre>
<p>Everything else stays at zod default (cache enabled, disk storage, gzip on, etc).</p>

<h3>Common profiles</h3>
<details>
<summary>dev (local laptop)</summary>
<pre><code>// config/config.development.json
{
  "server": { "host": "127.0.0.1", "port": 8080 },
  "logging": { "level": "debug" },
  "caching": { "ttl": 30 },
  "cluster": false
}</code></pre>
</details>
<details>
<summary>prod (single server + PM2 cluster)</summary>
<pre><code>// config/config.production.json
{
  "server": { "host": "127.0.0.1", "port": 8080, "protocol": "http" },
  "logging": { "level": "info" },
  "caching": {
    "ttl": 3600,
    "redis": { "enabled": true, "host": "127.0.0.1", "port": 6379 }
  },
  "headers": {
    "useGzipCompression": true,
    "cacheControl": { "default": "public, max-age=3600, immutable" }
  },
  "cluster": false
}</code></pre>
<p>Set <code>cluster: false</code> when running via PM2 cluster — PM2 already forks workers.</p>
</details>
<details>
<summary>prod (S3 + CloudFront)</summary>
<pre><code>// config/config.production.json (file part — non-secret)
{
  "images": { "directory": { "enabled": false }, "s3": { "enabled": true } },
  "assets": { "directory": { "enabled": false }, "s3": { "enabled": true } },
  "cloudfront": { "enabled": true }
}

# .env (secret part)
AWS_S3_IMAGES_ACCESS_KEY=...
AWS_S3_IMAGES_SECRET_KEY=...
AWS_S3_IMAGES_BUCKET_NAME=my-bucket
AWS_S3_IMAGES_REGION=ap-southeast-1
AWS_S3_ASSETS_ACCESS_KEY=...
AWS_S3_ASSETS_SECRET_KEY=...
AWS_S3_ASSETS_BUCKET_NAME=my-bucket-assets
AWS_S3_ASSETS_REGION=ap-southeast-1
CLOUDFRONT_ACCESS_KEY=...
CLOUDFRONT_SECRET_KEY=...
CLOUDFRONT_DISTRIBUTION=E1ABCDEF0</code></pre>
</details>
<details>
<summary>Full reference — every config key with default value</summary>
<pre><code>{
  "server": {
    "host": "0.0.0.0",
    "port": 8080,
    "protocol": "http",
    "enableHTTP2": true,
    "redirectPort": 0
  },
  "images": {
    "directory": { "enabled": true, "path": "./storage/images" },
    "s3": { "enabled": false, "bucketName": "", "region": "", "endpoint": "" },
    "remote": { "enabled": false, "path": "", "allowFullURL": true }
  },
  "assets": {
    "directory": { "enabled": true, "path": "./storage/assets" }
  },
  "caching": {
    "ttl": 3600,
    "cache404": true,
    "directory": { "enabled": true, "path": "./cache" },
    "redis": { "enabled": false, "host": "127.0.0.1", "port": 6379 },
    "expireAt": null
  },
  "security": { "maxWidth": 2048, "maxHeight": 2048 },
  "headers": {
    "useGzipCompression": true,
    "cacheControl": {
      "default": "public, max-age=3600",
      "paths": [],
      "mimetypes": [
        { "image/jpeg": "public, max-age=86400" },
        { "text/css": "public, max-age=86400" },
        { "application/javascript": "public, max-age=86400" }
      ]
    }
  },
  "cluster": false,
  "multiDomain": { "enabled": false, "directory": "domains" },
  "geolocation": { "enabled": false, "method": "maxmind" }
}</code></pre>
</details>

<h3>Per-domain config (multi-tenant)</h3>
<p>Enable <code>multiDomain.enabled: true</code> in the main config, then create per-host overrides:</p>
<pre><code>domains/
└── cdn.example.com/
    ├── config/
    │   └── config.production.json   # only keys to override for this host
    └── workspace/
        ├── recipes/
        ├── routes/
        └── plugins/</code></pre>
<p>The domain manager scans <code>domains/</code> at boot. Each per-host JSON layers on top of the main config (only fields marked <em>allowDomainOverride</em> in the schema can be overridden).</p>

<h3>Boot order</h3>
<pre><code>1. read zod defaults
2. read config/config.{NODE_ENV}.json if exists, deep-merge
3. read .env (or shell env), overlay top-level keys
4. zod validates → typed AppConfig
5. boot Fastify with merged result
6. chokidar watches the JSON file → repeat 2-4 on change</code></pre>

<h3>Layer 3 — <code>.env</code> (secrets + per-deploy)</h3>
<pre><code>cp .env.example .env
# edit values</code></pre>
<table>
  <thead><tr><th>Variable</th><th>Required?</th><th>Purpose</th></tr></thead>
  <tbody>
    <tr><td><code>NODE_ENV</code></td><td>no</td><td><code>development</code> (default) / <code>production</code> / <code>qa</code> / <code>test</code></td></tr>
    <tr><td><code>PORT</code></td><td>no</td><td>Listen port. Overrides config.</td></tr>
    <tr><td><code>HOST</code></td><td>no</td><td>Bind address. Default <code>0.0.0.0</code>.</td></tr>
    <tr><td><code>PROTOCOL</code></td><td>no</td><td><code>http</code> / <code>https</code></td></tr>
    <tr><td><code>AUTH_CLIENT_ID</code></td><td>for <code>/api/*</code></td><td>Client identifier for <code>/token</code></td></tr>
    <tr><td><code>AUTH_SECRET</code></td><td>for <code>/api/*</code></td><td>Secret paired with clientId</td></tr>
    <tr><td><code>AUTH_KEY</code></td><td>for <code>/api/*</code></td><td>JWT signing secret (HS256). Rotate periodically.</td></tr>
    <tr><td><code>CACHE_ENABLE_DIRECTORY</code></td><td>no</td><td><code>true</code> (default) / <code>false</code></td></tr>
    <tr><td><code>CACHE_ENABLE_REDIS</code></td><td>no</td><td><code>true</code> / <code>false</code></td></tr>
    <tr><td><code>REDIS_HOST</code>, <code>REDIS_PORT</code>, <code>REDIS_PASSWORD</code></td><td>if redis</td><td>Redis connection</td></tr>
    <tr><td><code>AWS_S3_IMAGES_*</code></td><td>if S3</td><td>S3 / DO Spaces for images: ACCESS_KEY, SECRET_KEY, BUCKET_NAME, REGION, ENDPOINT</td></tr>
    <tr><td><code>AWS_S3_ASSETS_*</code></td><td>if S3</td><td>Same five fields for assets</td></tr>
    <tr><td><code>CLOUDFRONT_ACCESS_KEY</code>, <code>CLOUDFRONT_SECRET_KEY</code>, <code>CLOUDFRONT_DISTRIBUTION</code></td><td>if used</td><td>CloudFront sync on <code>/api/flush</code></td></tr>
    <tr><td><code>RYUNACDN_NO_BANNER</code></td><td>no</td><td><code>true</code> hides startup banner (CI friendly)</td></tr>
  </tbody>
</table>
<p><strong>Rule of thumb:</strong> anything that's a secret → env. Anything that's a non-secret runtime tunable (TTL, header rules, image limits, cron) → config file. Env always overrides config.</p>
`,
      id: `
<p>Tiga layer, di-merge saat boot (yang belakang menang):</p>
<ol>
  <li><strong>zod default</strong> — built-in, selalu di-apply.</li>
  <li><strong>File JSON</strong> di <code>config/config.{NODE_ENV}.json</code> — opsional, non-secret tunable.</li>
  <li><strong>Env var</strong> dari <code>.env</code> atau shell — secret + override per-deploy.</li>
</ol>
<p>File JSON boleh tidak ada sama sekali (default + env cukup), atau override field yang kamu mau saja.</p>

<h3>Layer 2 — JSON config per environment</h3>
<p>File dipilih berdasarkan <code>NODE_ENV</code>:</p>
<table>
  <thead><tr><th><code>NODE_ENV</code></th><th>File yang dibaca</th></tr></thead>
  <tbody>
    <tr><td><code>development</code> (default)</td><td><code>config/config.development.json</code></td></tr>
    <tr><td><code>production</code></td><td><code>config/config.production.json</code></td></tr>
    <tr><td><code>qa</code></td><td><code>config/config.qa.json</code></td></tr>
    <tr><td><code>test</code></td><td><code>config/config.test.json</code></td></tr>
  </tbody>
</table>

<h3>Setup cepat</h3>
<pre><code># 1. Copy contoh
cp config/config.example.json config/config.development.json

# 2. Edit field yang berbeda dari default — chokidar watch file dan reload otomatis saat save</code></pre>

<h3>Partial override (recommended)</h3>
<p>Tidak perlu copy seluruh contoh. Override yang penting saja:</p>
<pre><code>// config/config.development.json — minimal
{
  "server": { "port": 9000 },
  "caching": { "ttl": 60 }
}</code></pre>
<p>Sisa pakai default zod (cache nyala, disk storage, gzip nyala, dll).</p>

<h3>Profil umum</h3>
<details>
<summary>dev (laptop lokal)</summary>
<pre><code>// config/config.development.json
{
  "server": { "host": "127.0.0.1", "port": 8080 },
  "logging": { "level": "debug" },
  "caching": { "ttl": 30 },
  "cluster": false
}</code></pre>
</details>
<details>
<summary>prod (server tunggal + PM2 cluster)</summary>
<pre><code>// config/config.production.json
{
  "server": { "host": "127.0.0.1", "port": 8080, "protocol": "http" },
  "logging": { "level": "info" },
  "caching": {
    "ttl": 3600,
    "redis": { "enabled": true, "host": "127.0.0.1", "port": 6379 }
  },
  "headers": {
    "useGzipCompression": true,
    "cacheControl": { "default": "public, max-age=3600, immutable" }
  },
  "cluster": false
}</code></pre>
<p>Set <code>cluster: false</code> saat run via PM2 cluster — PM2 sudah fork worker.</p>
</details>
<details>
<summary>prod (S3 + CloudFront)</summary>
<pre><code>// config/config.production.json (bagian file — non-secret)
{
  "images": { "directory": { "enabled": false }, "s3": { "enabled": true } },
  "assets": { "directory": { "enabled": false }, "s3": { "enabled": true } },
  "cloudfront": { "enabled": true }
}

# .env (bagian secret)
AWS_S3_IMAGES_ACCESS_KEY=...
AWS_S3_IMAGES_SECRET_KEY=...
AWS_S3_IMAGES_BUCKET_NAME=my-bucket
AWS_S3_IMAGES_REGION=ap-southeast-1
AWS_S3_ASSETS_ACCESS_KEY=...
AWS_S3_ASSETS_SECRET_KEY=...
AWS_S3_ASSETS_BUCKET_NAME=my-bucket-assets
AWS_S3_ASSETS_REGION=ap-southeast-1
CLOUDFRONT_ACCESS_KEY=...
CLOUDFRONT_SECRET_KEY=...
CLOUDFRONT_DISTRIBUTION=E1ABCDEF0</code></pre>
</details>
<details>
<summary>Referensi lengkap — semua key config beserta default</summary>
<pre><code>{
  "server": {
    "host": "0.0.0.0",
    "port": 8080,
    "protocol": "http",
    "enableHTTP2": true,
    "redirectPort": 0
  },
  "images": {
    "directory": { "enabled": true, "path": "./storage/images" },
    "s3": { "enabled": false, "bucketName": "", "region": "", "endpoint": "" },
    "remote": { "enabled": false, "path": "", "allowFullURL": true }
  },
  "assets": {
    "directory": { "enabled": true, "path": "./storage/assets" }
  },
  "caching": {
    "ttl": 3600,
    "cache404": true,
    "directory": { "enabled": true, "path": "./cache" },
    "redis": { "enabled": false, "host": "127.0.0.1", "port": 6379 },
    "expireAt": null
  },
  "security": { "maxWidth": 2048, "maxHeight": 2048 },
  "headers": {
    "useGzipCompression": true,
    "cacheControl": {
      "default": "public, max-age=3600",
      "paths": [],
      "mimetypes": [
        { "image/jpeg": "public, max-age=86400" },
        { "text/css": "public, max-age=86400" },
        { "application/javascript": "public, max-age=86400" }
      ]
    }
  },
  "cluster": false,
  "multiDomain": { "enabled": false, "directory": "domains" },
  "geolocation": { "enabled": false, "method": "maxmind" }
}</code></pre>
</details>

<h3>Per-domain config (multi-tenant)</h3>
<p>Aktifkan <code>multiDomain.enabled: true</code> di config utama, lalu buat override per-host:</p>
<pre><code>domains/
└── cdn.example.com/
    ├── config/
    │   └── config.production.json   # cuma key yang mau di-override per host
    └── workspace/
        ├── recipes/
        ├── routes/
        └── plugins/</code></pre>
<p>Domain manager scan folder <code>domains/</code> saat boot. JSON per-host di-layer di atas config utama (hanya field yang ditandai <em>allowDomainOverride</em> di schema yang bisa di-override).</p>

<h3>Urutan boot</h3>
<pre><code>1. baca default zod
2. baca config/config.{NODE_ENV}.json kalau ada, deep-merge
3. baca .env (atau shell env), overlay key top-level
4. zod validasi → typed AppConfig
5. boot Fastify dengan hasil merged
6. chokidar watch file JSON → ulang 2-4 saat ada perubahan</code></pre>

<h3>Layer 3 — <code>.env</code> (secret + per-deploy)</h3>
<pre><code>cp .env.example .env
# edit isinya</code></pre>
<table>
  <thead><tr><th>Variable</th><th>Wajib?</th><th>Fungsi</th></tr></thead>
  <tbody>
    <tr><td><code>NODE_ENV</code></td><td>tidak</td><td><code>development</code> (default) / <code>production</code> / <code>qa</code> / <code>test</code></td></tr>
    <tr><td><code>PORT</code></td><td>tidak</td><td>Port listen. Menimpa config.</td></tr>
    <tr><td><code>HOST</code></td><td>tidak</td><td>Bind address. Default <code>0.0.0.0</code>.</td></tr>
    <tr><td><code>PROTOCOL</code></td><td>tidak</td><td><code>http</code> / <code>https</code></td></tr>
    <tr><td><code>AUTH_CLIENT_ID</code></td><td>untuk <code>/api/*</code></td><td>Client identifier untuk <code>/token</code></td></tr>
    <tr><td><code>AUTH_SECRET</code></td><td>untuk <code>/api/*</code></td><td>Secret pasangan clientId</td></tr>
    <tr><td><code>AUTH_KEY</code></td><td>untuk <code>/api/*</code></td><td>JWT signing secret (HS256). Rotate berkala.</td></tr>
    <tr><td><code>CACHE_ENABLE_DIRECTORY</code></td><td>tidak</td><td><code>true</code> (default) / <code>false</code></td></tr>
    <tr><td><code>CACHE_ENABLE_REDIS</code></td><td>tidak</td><td><code>true</code> / <code>false</code></td></tr>
    <tr><td><code>REDIS_HOST</code>, <code>REDIS_PORT</code>, <code>REDIS_PASSWORD</code></td><td>kalau redis</td><td>Koneksi Redis</td></tr>
    <tr><td><code>AWS_S3_IMAGES_*</code></td><td>kalau S3</td><td>S3 / DO Spaces untuk image: ACCESS_KEY, SECRET_KEY, BUCKET_NAME, REGION, ENDPOINT</td></tr>
    <tr><td><code>AWS_S3_ASSETS_*</code></td><td>kalau S3</td><td>Sama lima field untuk asset</td></tr>
    <tr><td><code>CLOUDFRONT_*</code></td><td>kalau dipakai</td><td>Sync CloudFront saat <code>/api/flush</code></td></tr>
    <tr><td><code>RYUNACDN_NO_BANNER</code></td><td>tidak</td><td><code>true</code> sembunyiin banner boot</td></tr>
  </tbody>
</table>
<p><strong>Patokan:</strong> apapun yang secret → env. Yang non-secret runtime tunable (TTL, header rule, image limit, cron) → file config. Env selalu override config.</p>
`
    }
  },
  {
    id: 'running',
    title: { en: 'Running', id: 'Menjalankan' },
    body: {
      en: `
<h3>Development</h3>
<pre><code>pnpm dev           # tsx watch — hot reload, no build step</code></pre>

<h3>Production (single process)</h3>
<pre><code>pnpm build
NODE_ENV=production pnpm start</code></pre>

<h3>Production (PM2 cluster, recommended)</h3>
<pre><code>pnpm prod          # build + pm2 start ecosystem.config.cjs
pnpm prod:status   # see worker table
pnpm prod:logs     # tail logs
pnpm prod:restart  # zero-downtime reload
pnpm prod:stop     # stop all workers</code></pre>
<p>PM2 manages cluster (1 worker per CPU), auto-restart on crash, restart on memory above 1 GB. Set <code>cluster: false</code> in your app config so the internal <code>node:cluster</code> fork doesn't overlap with PM2's.</p>

<h3>Behind a reverse proxy</h3>
<p>Set <code>HOST=127.0.0.1</code> and let nginx / caddy terminate TLS:</p>
<pre><code># Caddy snippet
cdn.example.com {
  reverse_proxy 127.0.0.1:8080
}</code></pre>`,
      id: `
<h3>Development</h3>
<pre><code>pnpm dev           # tsx watch — hot reload, tanpa build</code></pre>

<h3>Production (single process)</h3>
<pre><code>pnpm build
NODE_ENV=production pnpm start</code></pre>

<h3>Production (PM2 cluster, recommended)</h3>
<pre><code>pnpm prod          # build + pm2 start ecosystem.config.cjs
pnpm prod:status   # liat tabel worker
pnpm prod:logs     # tail log
pnpm prod:restart  # reload zero-downtime
pnpm prod:stop     # stop semua worker</code></pre>
<p>PM2 ngatur cluster (1 worker per CPU), auto-restart kalau crash, restart kalau memori lewat 1 GB. Set <code>cluster: false</code> di config app supaya <code>node:cluster</code> internal tidak dobel sama PM2.</p>

<h3>Di belakang reverse proxy</h3>
<p>Set <code>HOST=127.0.0.1</code>, biar nginx / caddy yang handle TLS:</p>
<pre><code># Caddy snippet
cdn.example.com {
  reverse_proxy 127.0.0.1:8080
}</code></pre>`
    }
  },
  {
    id: 'usage-basic',
    title: { en: 'Basic usage', id: 'Penggunaan dasar' },
    body: {
      en: `
<p>Once a file lives under your storage source, request it directly.</p>
<pre><code># Local disk (default)
cp ~/Pictures/cat.jpg ./storage/images/cat.jpg
curl http://localhost:8080/cat.jpg                 # raw
curl 'http://localhost:8080/cat.jpg?width=400'     # resize</code></pre>

<h3>Resizing</h3>
<pre><code># Explicit dimensions
GET /cat.jpg?width=400&amp;height=300

# Width only, preserve aspect
GET /cat.jpg?width=400

# Force aspect ratio
GET /cat.jpg?ratio=16-9&amp;width=800</code></pre>

<h3>Format conversion</h3>
<pre><code># Output WebP
GET /cat.jpg?format=webp

# WebP if browser supports, else JPEG fallback
GET /cat.jpg?format=webp,jpg

# AVIF
GET /cat.jpg?format=avif</code></pre>

<h3>Smart crop</h3>
<pre><code># Crop to square using smartcrop entropy detection
GET /cat.jpg?width=300&amp;height=300&amp;resize=entropy

# Crop to fill area, picking gravity
GET /cat.jpg?width=300&amp;height=300&amp;resize=aspectfill&amp;gravity=Center</code></pre>

<h3>Metadata + palette</h3>
<pre><code>GET /cat.jpg?format=json
# returns dimensions + color palette + EXIF</code></pre>`,
      id: `
<p>Begitu file ada di storage source, langsung di-request URL-nya.</p>
<pre><code># Disk lokal (default)
cp ~/Pictures/cat.jpg ./storage/images/cat.jpg
curl http://localhost:8080/cat.jpg                 # raw
curl 'http://localhost:8080/cat.jpg?width=400'     # resize</code></pre>

<h3>Resize</h3>
<pre><code># Dimensi explicit
GET /cat.jpg?width=400&amp;height=300

# Width saja, aspect preserve
GET /cat.jpg?width=400

# Paksa aspect ratio
GET /cat.jpg?ratio=16-9&amp;width=800</code></pre>

<h3>Konversi format</h3>
<pre><code># Output WebP
GET /cat.jpg?format=webp

# WebP kalau browser support, fallback JPEG
GET /cat.jpg?format=webp,jpg

# AVIF
GET /cat.jpg?format=avif</code></pre>

<h3>Smart crop</h3>
<pre><code># Crop persegi pakai entropy detection
GET /cat.jpg?width=300&amp;height=300&amp;resize=entropy

# Crop fill area, pilih gravity
GET /cat.jpg?width=300&amp;height=300&amp;resize=aspectfill&amp;gravity=Center</code></pre>

<h3>Metadata + palette</h3>
<pre><code>GET /cat.jpg?format=json
# return dimensi + palette warna + EXIF</code></pre>`
    }
  },
  {
    id: 'image-params',
    title: { en: 'Image parameters', id: 'Parameter image' },
    body: {
      en: `
<table>
  <thead><tr><th>Param</th><th>Alias</th><th>Values</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td><code>width</code></td><td><code>w</code></td><td>1–maxWidth</td><td>Output width in px</td></tr>
    <tr><td><code>height</code></td><td><code>h</code></td><td>1–maxHeight</td><td>Output height in px</td></tr>
    <tr><td><code>ratio</code></td><td><code>rx</code></td><td><code>16-9</code></td><td>Force aspect ratio</td></tr>
    <tr><td><code>format</code></td><td><code>fmt</code></td><td>jpg jpeg png webp avif gif json</td><td>Output format. Comma fallback supported.</td></tr>
    <tr><td><code>quality</code></td><td><code>q</code></td><td>1–100</td><td>Encoder quality (default 75)</td></tr>
    <tr><td><code>resizeStyle</code></td><td><code>resize</code></td><td>aspectfit aspectfill fill crop entropy</td><td>How to fit into target box</td></tr>
    <tr><td><code>gravity</code></td><td><code>g</code></td><td>NW N NE W C E SW S SE None</td><td>Crop anchor</td></tr>
    <tr><td><code>crop</code></td><td><code>coords</code></td><td><code>top,left,bottom,right</code></td><td>Explicit crop box</td></tr>
    <tr><td><code>cropX</code> / <code>cropY</code></td><td><code>cx</code> / <code>cy</code></td><td>integers</td><td>Crop offset</td></tr>
    <tr><td><code>devicePixelRatio</code></td><td><code>dpr</code></td><td>1–3</td><td>Multiplies width/height for retina</td></tr>
    <tr><td><code>blur</code></td><td><code>b</code></td><td>0.3–1000</td><td>Gaussian sigma</td></tr>
    <tr><td><code>sharpen</code></td><td><code>sh</code></td><td>1+</td><td>Sharpen sigma</td></tr>
    <tr><td><code>saturate</code></td><td><code>sat</code></td><td>0 or 1</td><td>0 = greyscale</td></tr>
    <tr><td><code>rotate</code></td><td><code>r</code></td><td>multiples of 90</td><td>Rotation degrees</td></tr>
    <tr><td><code>flip</code></td><td><code>fl</code></td><td>x y xy</td><td>Mirror axis</td></tr>
    <tr><td><code>progressive</code></td><td><code>pg</code></td><td><code>true</code></td><td>Progressive JPEG</td></tr>
    <tr><td><code>strip</code></td><td><code>s</code></td><td>0/1</td><td>Strip metadata</td></tr>
  </tbody>
</table>`,
      id: `
<table>
  <thead><tr><th>Param</th><th>Alias</th><th>Nilai</th><th>Penjelasan</th></tr></thead>
  <tbody>
    <tr><td><code>width</code></td><td><code>w</code></td><td>1–maxWidth</td><td>Lebar output (px)</td></tr>
    <tr><td><code>height</code></td><td><code>h</code></td><td>1–maxHeight</td><td>Tinggi output (px)</td></tr>
    <tr><td><code>ratio</code></td><td><code>rx</code></td><td><code>16-9</code></td><td>Paksa aspect ratio</td></tr>
    <tr><td><code>format</code></td><td><code>fmt</code></td><td>jpg jpeg png webp avif gif json</td><td>Format output. Bisa fallback comma-separated.</td></tr>
    <tr><td><code>quality</code></td><td><code>q</code></td><td>1–100</td><td>Kualitas encoder (default 75)</td></tr>
    <tr><td><code>resizeStyle</code></td><td><code>resize</code></td><td>aspectfit aspectfill fill crop entropy</td><td>Cara fit ke target box</td></tr>
    <tr><td><code>gravity</code></td><td><code>g</code></td><td>NW N NE W C E SW S SE None</td><td>Anchor crop</td></tr>
    <tr><td><code>crop</code></td><td><code>coords</code></td><td><code>top,left,bottom,right</code></td><td>Crop box explicit</td></tr>
    <tr><td><code>cropX</code> / <code>cropY</code></td><td><code>cx</code> / <code>cy</code></td><td>integer</td><td>Offset crop</td></tr>
    <tr><td><code>devicePixelRatio</code></td><td><code>dpr</code></td><td>1–3</td><td>Multiplier untuk retina</td></tr>
    <tr><td><code>blur</code></td><td><code>b</code></td><td>0.3–1000</td><td>Sigma Gaussian</td></tr>
    <tr><td><code>sharpen</code></td><td><code>sh</code></td><td>1+</td><td>Sigma sharpen</td></tr>
    <tr><td><code>saturate</code></td><td><code>sat</code></td><td>0 atau 1</td><td>0 = greyscale</td></tr>
    <tr><td><code>rotate</code></td><td><code>r</code></td><td>kelipatan 90</td><td>Derajat rotasi</td></tr>
    <tr><td><code>flip</code></td><td><code>fl</code></td><td>x y xy</td><td>Axis mirror</td></tr>
    <tr><td><code>progressive</code></td><td><code>pg</code></td><td><code>true</code></td><td>Progressive JPEG</td></tr>
    <tr><td><code>strip</code></td><td><code>s</code></td><td>0/1</td><td>Strip metadata</td></tr>
  </tbody>
</table>`
    }
  },
  {
    id: 'auth',
    title: { en: 'Authentication', id: 'Autentikasi' },
    body: {
      en: `
<p>All <code>/api/*</code> endpoints require a bearer token. Set <code>AUTH_CLIENT_ID</code>, <code>AUTH_SECRET</code>, <code>AUTH_KEY</code> in <code>.env</code>.</p>

<h3>1. Get a token</h3>
<pre><code>curl -X POST http://localhost:8080/token \\
  -H 'content-type: application/json' \\
  -d '{"clientId":"my-id","secret":"my-secret"}'</code></pre>
<p>Response:</p>
<pre><code>{
  "accessToken": "eyJhbG...",
  "tokenType": "Bearer",
  "expiresIn": 1800
}</code></pre>

<h3>2. Call a protected endpoint</h3>
<pre><code>curl -X POST http://localhost:8080/api/flush \\
  -H 'authorization: Bearer eyJhbG...' \\
  -H 'content-type: application/json' \\
  -d '{"pattern":"*"}'</code></pre>

<h3>Token lifetime</h3>
<p>Default 1800 seconds (30 min). Tunable via <code>auth.tokenTtl</code> in config.</p>`,
      id: `
<p>Semua endpoint <code>/api/*</code> butuh bearer token. Set <code>AUTH_CLIENT_ID</code>, <code>AUTH_SECRET</code>, <code>AUTH_KEY</code> di <code>.env</code>.</p>

<h3>1. Ambil token</h3>
<pre><code>curl -X POST http://localhost:8080/token \\
  -H 'content-type: application/json' \\
  -d '{"clientId":"my-id","secret":"my-secret"}'</code></pre>
<p>Response:</p>
<pre><code>{
  "accessToken": "eyJhbG...",
  "tokenType": "Bearer",
  "expiresIn": 1800
}</code></pre>

<h3>2. Panggil endpoint yang protected</h3>
<pre><code>curl -X POST http://localhost:8080/api/flush \\
  -H 'authorization: Bearer eyJhbG...' \\
  -H 'content-type: application/json' \\
  -d '{"pattern":"*"}'</code></pre>

<h3>Lifetime token</h3>
<p>Default 1800 detik (30 menit). Bisa diatur di <code>auth.tokenTtl</code> config.</p>`
    }
  },
  {
    id: 'upload',
    title: { en: 'Upload & delete', id: 'Upload & delete' },
    body: {
      en: `
<h3>Upload image (PNG / JPG / GIF / WebP / AVIF)</h3>
<pre><code>curl -X POST http://localhost:8080/upload_image \\
  -F image=@photo.jpg \\
  -F path=2026/jan</code></pre>
<p>Response:</p>
<pre><code>{
  "status": true,
  "message": "Image has been uploaded successfully.",
  "filename": "1780137107476-photo.jpg",
  "url": "http://localhost:8080/2026/jan/1780137107476-photo.jpg"
}</code></pre>
<ul>
  <li><code>image</code> — multipart file field (required)</li>
  <li><code>path</code> — optional sub-directory under <code>storage/images/</code></li>
  <li>MIME content is sniffed via <code>file-type</code>; extension alone is not trusted</li>
  <li><code>path</code> is sanitized: <code>../</code> and absolute paths are rejected</li>
</ul>

<h3>Upload other asset (anything except images)</h3>
<pre><code>curl -X POST http://localhost:8080/upload_file \\
  -F asset=@brochure.pdf \\
  -F path=docs</code></pre>

<h3>Delete image / asset</h3>
<pre><code>curl -X DELETE http://localhost:8080/delete_image \\
  -H 'content-type: application/json' \\
  -d '{"filename":"1780137107476-photo.jpg","path":"2026/jan"}'

curl -X DELETE http://localhost:8080/delete_asset \\
  -H 'content-type: application/json' \\
  -d '{"filename":"brochure.pdf","path":"docs"}'</code></pre>`,
      id: `
<h3>Upload image (PNG / JPG / GIF / WebP / AVIF)</h3>
<pre><code>curl -X POST http://localhost:8080/upload_image \\
  -F image=@photo.jpg \\
  -F path=2026/jan</code></pre>
<p>Response:</p>
<pre><code>{
  "status": true,
  "message": "Image has been uploaded successfully.",
  "filename": "1780137107476-photo.jpg",
  "url": "http://localhost:8080/2026/jan/1780137107476-photo.jpg"
}</code></pre>
<ul>
  <li><code>image</code> — multipart file field (wajib)</li>
  <li><code>path</code> — opsional, sub-directory di bawah <code>storage/images/</code></li>
  <li>MIME content di-sniff via <code>file-type</code>; extension saja tidak dipercaya</li>
  <li><code>path</code> di-sanitize: <code>../</code> dan absolute path ditolak</li>
</ul>

<h3>Upload asset lain (selain image)</h3>
<pre><code>curl -X POST http://localhost:8080/upload_file \\
  -F asset=@brochure.pdf \\
  -F path=docs</code></pre>

<h3>Delete image / asset</h3>
<pre><code>curl -X DELETE http://localhost:8080/delete_image \\
  -H 'content-type: application/json' \\
  -d '{"filename":"1780137107476-photo.jpg","path":"2026/jan"}'

curl -X DELETE http://localhost:8080/delete_asset \\
  -H 'content-type: application/json' \\
  -d '{"filename":"brochure.pdf","path":"docs"}'</code></pre>`
    }
  },
  {
    id: 'pdf',
    title: { en: 'Page → PDF', id: 'Page → PDF' },
    body: {
      en: `
<pre><code>curl -X POST http://localhost:8080/page_to_pdf \\
  -H 'content-type: application/json' \\
  -d '{
    "url": "https://example.com",
    "filename": "export.pdf",
    "format": "A4",
    "landscape": false
  }'</code></pre>
<p>Renders the URL with Puppeteer (headless Chromium) and writes the PDF into <code>storage/assets/</code>.</p>
<ul>
  <li><code>url</code> must be <code>http://</code> or <code>https://</code>. <code>file://</code> / <code>data:</code> blocked.</li>
  <li><code>format</code>: A0–A6, Letter, Legal, Tabloid, Ledger (default A4)</li>
  <li><code>landscape</code>: <code>true</code> for landscape orientation</li>
  <li>Timeout: 60 seconds per render</li>
</ul>`,
      id: `
<pre><code>curl -X POST http://localhost:8080/page_to_pdf \\
  -H 'content-type: application/json' \\
  -d '{
    "url": "https://example.com",
    "filename": "export.pdf",
    "format": "A4",
    "landscape": false
  }'</code></pre>
<p>Render URL pakai Puppeteer (headless Chromium), simpan PDF ke <code>storage/assets/</code>.</p>
<ul>
  <li><code>url</code> harus <code>http://</code> atau <code>https://</code>. <code>file://</code> / <code>data:</code> diblok.</li>
  <li><code>format</code>: A0–A6, Letter, Legal, Tabloid, Ledger (default A4)</li>
  <li><code>landscape</code>: <code>true</code> untuk orientasi landscape</li>
  <li>Timeout: 60 detik per render</li>
</ul>`
    }
  },
  {
    id: 'cache',
    title: { en: 'Cache & invalidation', id: 'Cache & invalidasi' },
    body: {
      en: `
<h3>How it works</h3>
<p>Each computed image / minified asset is keyed on (URL, query, domain) and stored either to disk (<code>cacache</code>) or Redis. TTL is <code>caching.ttl</code> seconds (default 3600).</p>

<h3>Manual flush</h3>
<pre><code>curl -X POST http://localhost:8080/api/flush \\
  -H 'authorization: Bearer ...' \\
  -H 'content-type: application/json' \\
  -d '{"pattern":"/cat.jpg"}'</code></pre>
<table>
  <thead><tr><th>Pattern</th><th>Effect</th></tr></thead>
  <tbody>
    <tr><td><code>"*"</code></td><td>Flush everything in this domain</td></tr>
    <tr><td><code>"/path/file.jpg"</code></td><td>Flush exact URL</td></tr>
    <tr><td><code>"/uploads/*"</code></td><td>Flush by prefix</td></tr>
  </tbody>
</table>

<h3>Auto flush by schedule</h3>
<pre><code>// config
{ "caching": { "expireAt": "0 3 * * *" } }   // 03:00 daily</code></pre>

<h3>CloudFront sync</h3>
<p>If <code>cloudfront.enabled=true</code>, every <code>/api/flush</code> also creates a CloudFront invalidation for the same pattern.</p>`,
      id: `
<h3>Cara kerja</h3>
<p>Setiap image hasil komputasi / asset hasil minify di-key berdasarkan (URL, query, domain) dan disimpan ke disk (<code>cacache</code>) atau Redis. TTL dari <code>caching.ttl</code> detik (default 3600).</p>

<h3>Flush manual</h3>
<pre><code>curl -X POST http://localhost:8080/api/flush \\
  -H 'authorization: Bearer ...' \\
  -H 'content-type: application/json' \\
  -d '{"pattern":"/cat.jpg"}'</code></pre>
<table>
  <thead><tr><th>Pattern</th><th>Efek</th></tr></thead>
  <tbody>
    <tr><td><code>"*"</code></td><td>Flush semua di domain ini</td></tr>
    <tr><td><code>"/path/file.jpg"</code></td><td>Flush URL exact</td></tr>
    <tr><td><code>"/uploads/*"</code></td><td>Flush by prefix</td></tr>
  </tbody>
</table>

<h3>Auto flush by schedule</h3>
<pre><code>// config
{ "caching": { "expireAt": "0 3 * * *" } }   // 03:00 tiap hari</code></pre>

<h3>Sync CloudFront</h3>
<p>Kalau <code>cloudfront.enabled=true</code>, setiap <code>/api/flush</code> juga bikin CloudFront invalidation pattern yang sama.</p>`
    }
  },
  {
    id: 'recipes',
    title: { en: 'Recipes & routes', id: 'Recipes & routes' },
    body: {
      en: `
<h3>Recipe</h3>
<p>JSON file under <code>workspace/recipes/</code> defining a preset transformation. Accessed as <code>/&lt;recipe&gt;/&lt;file&gt;</code>.</p>
<pre><code>// workspace/recipes/thumb.json
{
  "recipe": "thumb",
  "path": "/uploads",
  "settings": {
    "format": "webp",
    "quality": 75,
    "width": 300,
    "height": 300,
    "resizeStyle": "aspectfill"
  }
}</code></pre>
<pre><code>GET /thumb/cat.jpg
# applies thumb preset to /uploads/cat.jpg</code></pre>

<h3>Route</h3>
<p>JSON file under <code>workspace/routes/</code>. Picks a recipe conditionally based on request properties.</p>
<pre><code>// workspace/routes/responsive.json
{
  "route": "responsive",
  "branches": [
    { "condition": { "device": "mobile" }, "recipe": "thumb-mobile" },
    { "condition": { "device": "tablet" }, "recipe": "thumb-tablet" },
    { "recipe": "thumb" }
  ]
}</code></pre>
<p>Supported conditions: <code>device</code>, <code>language</code> (+ <code>languageMinQuality</code>), <code>country</code> (needs geolocation), <code>network</code>.</p>
<pre><code>GET /responsive/cat.jpg
# server picks the matching branch and applies its recipe</code></pre>

<h3>Plugin</h3>
<p>Custom JS handler under <code>workspace/plugins/</code>. Accessed as <code>/&lt;plugin-name&gt;/...</code>. See <code>examples/plugins/</code> for reference (duotone, layout).</p>

<h3>API mode</h3>
<p>Recipes and routes can also be registered at runtime via authenticated POST:</p>
<pre><code>POST /api/recipes   body: <recipe JSON>
POST /api/routes    body: <route JSON></code></pre>`,
      id: `
<h3>Recipe</h3>
<p>File JSON di <code>workspace/recipes/</code> yang define preset transformasi. Diakses sebagai <code>/&lt;recipe&gt;/&lt;file&gt;</code>.</p>
<pre><code>// workspace/recipes/thumb.json
{
  "recipe": "thumb",
  "path": "/uploads",
  "settings": {
    "format": "webp",
    "quality": 75,
    "width": 300,
    "height": 300,
    "resizeStyle": "aspectfill"
  }
}</code></pre>
<pre><code>GET /thumb/cat.jpg
# preset thumb dipakai ke /uploads/cat.jpg</code></pre>

<h3>Route</h3>
<p>File JSON di <code>workspace/routes/</code>. Pilih recipe conditional berdasarkan property request.</p>
<pre><code>// workspace/routes/responsive.json
{
  "route": "responsive",
  "branches": [
    { "condition": { "device": "mobile" }, "recipe": "thumb-mobile" },
    { "condition": { "device": "tablet" }, "recipe": "thumb-tablet" },
    { "recipe": "thumb" }
  ]
}</code></pre>
<p>Condition yang didukung: <code>device</code>, <code>language</code> (+ <code>languageMinQuality</code>), <code>country</code> (butuh geolocation), <code>network</code>.</p>
<pre><code>GET /responsive/cat.jpg
# server pilih branch yang match, terapkan recipe-nya</code></pre>

<h3>Plugin</h3>
<p>Custom JS handler di <code>workspace/plugins/</code>. Diakses sebagai <code>/&lt;nama-plugin&gt;/...</code>. Liat <code>examples/plugins/</code> untuk referensi (duotone, layout).</p>

<h3>Mode API</h3>
<p>Recipe dan route juga bisa di-register runtime via POST yang authenticated:</p>
<pre><code>POST /api/recipes   body: <recipe JSON>
POST /api/routes    body: <route JSON></code></pre>`
    }
  },
  {
    id: 'logging',
    title: { en: 'Logging', id: 'Logging' },
    body: {
      en: `
<p>Format:</p>
<pre><code>[YYYY-MM-DD HH:MM:SS.lll] LEVEL: [Class] message</code></pre>
<p>Each module logs with a <code>[Class]</code> prefix (e.g. <code>[HTTP]</code>, <code>[ImageHandler]</code>, <code>[Cache]</code>). Emoji are used sparingly in messages — never in time or class.</p>

<h3>Levels</h3>
<table>
  <thead><tr><th>Level</th><th>When</th></tr></thead>
  <tbody>
    <tr><td><code>fatal</code></td><td>Process is about to exit</td></tr>
    <tr><td><code>error</code></td><td>Request failed, S3 down, etc</td></tr>
    <tr><td><code>warn</code></td><td>Worker died, retry, soft failure</td></tr>
    <tr><td><code>info</code></td><td>Request completed, startup events</td></tr>
    <tr><td><code>debug</code></td><td>S3 request payloads, cache hits</td></tr>
    <tr><td><code>trace</code></td><td>Very verbose</td></tr>
  </tbody>
</table>
<p>Pick level via <code>logging.level</code> in config or <code>LOG_LEVEL</code> env.</p>

<h3>Disable boot banner</h3>
<pre><code>RYUNACDN_NO_BANNER=true pnpm start</code></pre>`,
      id: `
<p>Format:</p>
<pre><code>[YYYY-MM-DD HH:MM:SS.lll] LEVEL: [Class] pesan</code></pre>
<p>Tiap module log dengan prefix <code>[Class]</code> (contoh <code>[HTTP]</code>, <code>[ImageHandler]</code>, <code>[Cache]</code>). Emoji dipakai sedikit di pesan — tidak di waktu atau class.</p>

<h3>Level</h3>
<table>
  <thead><tr><th>Level</th><th>Kapan</th></tr></thead>
  <tbody>
    <tr><td><code>fatal</code></td><td>Process mau exit</td></tr>
    <tr><td><code>error</code></td><td>Request gagal, S3 down, dll</td></tr>
    <tr><td><code>warn</code></td><td>Worker mati, retry, soft failure</td></tr>
    <tr><td><code>info</code></td><td>Request done, event startup</td></tr>
    <tr><td><code>debug</code></td><td>Payload S3 request, cache hit</td></tr>
    <tr><td><code>trace</code></td><td>Sangat verbose</td></tr>
  </tbody>
</table>
<p>Pilih level via <code>logging.level</code> di config atau <code>LOG_LEVEL</code> env.</p>

<h3>Matikan banner boot</h3>
<pre><code>RYUNACDN_NO_BANNER=true pnpm start</code></pre>`
    }
  },
  {
    id: 'security',
    title: { en: 'Security', id: 'Keamanan' },
    body: {
      en: `
<ul>
  <li>Upload routes validate MIME via <code>file-type</code> sniff — not just extension.</li>
  <li><code>path</code> in upload / delete is sanitized through <code>safeJoin</code>; <code>../</code> and absolute paths return 400.</li>
  <li><code>/page_to_pdf</code> rejects non-<code>http(s)</code> URLs (no <code>file://</code>, no <code>data:</code>).</li>
  <li>JWT secret (<code>AUTH_KEY</code>) lives in env only — never commit it.</li>
  <li>Rotate <code>AUTH_KEY</code> periodically.</li>
  <li><code>X-Robots-Tag: noindex, nofollow, noarchive, nosnippet</code> is set on every response. <code>/robots.txt</code> denies all crawlers. Suitable for internal-only deployments.</li>
  <li>Default image limits: <code>security.maxWidth = 2048</code>, <code>security.maxHeight = 2048</code> — tune for your bandwidth.</li>
</ul>`,
      id: `
<ul>
  <li>Upload route validasi MIME via <code>file-type</code> sniff — tidak pakai extension saja.</li>
  <li><code>path</code> di upload / delete di-sanitize via <code>safeJoin</code>; <code>../</code> dan absolute path return 400.</li>
  <li><code>/page_to_pdf</code> reject URL non-<code>http(s)</code> (tidak ada <code>file://</code>, <code>data:</code>).</li>
  <li>JWT secret (<code>AUTH_KEY</code>) cuma di env — jangan di-commit.</li>
  <li>Rotate <code>AUTH_KEY</code> berkala.</li>
  <li><code>X-Robots-Tag: noindex, nofollow, noarchive, nosnippet</code> di-set semua response. <code>/robots.txt</code> deny semua crawler. Cocok untuk deploy internal-only.</li>
  <li>Default image limit: <code>security.maxWidth = 2048</code>, <code>security.maxHeight = 2048</code> — tune sesuai bandwidth.</li>
</ul>`
    }
  },
  {
    id: 'api-collections',
    title: { en: 'API collections', id: 'Koleksi API' },
    body: {
      en: `
<p>Ready-to-use collections for the three main API clients. Each contains the same folder structure:</p>
<ul>
  <li><strong>Public</strong> — no auth required (welcome, docs, transforms, upload, delete, PDF)</li>
  <li><strong>Auth</strong> — get a bearer token from <code>/token</code> (auto-captured into <code>{{accessToken}}</code>)</li>
  <li><strong>Authenticated</strong> — bearer-protected admin endpoints (<code>/api/flush</code>, <code>/api/recipes</code>, <code>/api/routes</code>, <code>/api/status</code>)</li>
  <li><strong>Multi-domain admin</strong> — <code>/_ryunacdn/domains</code> endpoints (open when <code>multiDomain.configurationApi=true</code>)</li>
</ul>

<h3>Download</h3>
<table>
  <thead><tr><th>Client</th><th>File</th><th>Import</th></tr></thead>
  <tbody>
    <tr>
      <td><strong>Postman</strong></td>
      <td><a href="/collections/postman">RyunaCDN.postman_collection.json</a></td>
      <td>File → Import → drop the JSON file</td>
    </tr>
    <tr>
      <td><strong>Insomnia</strong></td>
      <td><a href="/collections/insomnia">RyunaCDN.insomnia.json</a></td>
      <td>Application → Preferences → Data → Import Data → From File</td>
    </tr>
    <tr>
      <td><strong>Bruno</strong></td>
      <td><a href="/collections/bruno">RyunaCDN.bruno.zip</a></td>
      <td>Unzip → Bruno → Open Collection → pick the <code>RyunaCDN/</code> folder</td>
    </tr>
  </tbody>
</table>

<h3>Variables</h3>
<p>All three ship with these variables — set them before calling protected endpoints:</p>
<table>
  <thead><tr><th>Variable</th><th>Default</th><th>Description</th></tr></thead>
  <tbody>
    <tr><td><code>baseUrl</code></td><td><code>http://localhost:8080</code></td><td>API base URL</td></tr>
    <tr><td><code>clientId</code></td><td>(empty)</td><td>Set to your <code>AUTH_CLIENT_ID</code></td></tr>
    <tr><td><code>secret</code></td><td>(empty)</td><td>Set to your <code>AUTH_SECRET</code></td></tr>
    <tr><td><code>accessToken</code></td><td>(empty)</td><td>Auto-populated by "Get bearer token" request</td></tr>
  </tbody>
</table>

<h3>Workflow</h3>
<ol>
  <li>Set <code>baseUrl</code>, <code>clientId</code>, <code>secret</code>.</li>
  <li>Run <strong>Auth → Get bearer token</strong>. The response's <code>accessToken</code> is captured automatically.</li>
  <li>Run any request in <strong>Authenticated</strong> folder — bearer is auto-attached.</li>
  <li>For <strong>Multi-domain admin</strong>, enable <code>multiDomain.enabled=true</code> + <code>multiDomain.configurationApi=true</code> on the server first.</li>
</ol>`,
      id: `
<p>Koleksi siap pakai untuk 3 API client utama. Struktur folder semua sama:</p>
<ul>
  <li><strong>Public</strong> — tanpa auth (welcome, docs, transform, upload, delete, PDF)</li>
  <li><strong>Auth</strong> — ambil bearer token dari <code>/token</code> (auto-capture ke <code>{{accessToken}}</code>)</li>
  <li><strong>Authenticated</strong> — endpoint admin yang protected bearer (<code>/api/flush</code>, <code>/api/recipes</code>, <code>/api/routes</code>, <code>/api/status</code>)</li>
  <li><strong>Multi-domain admin</strong> — endpoint <code>/_ryunacdn/domains</code> (terbuka kalau <code>multiDomain.configurationApi=true</code>)</li>
</ul>

<h3>Download</h3>
<table>
  <thead><tr><th>Client</th><th>File</th><th>Cara import</th></tr></thead>
  <tbody>
    <tr>
      <td><strong>Postman</strong></td>
      <td><a href="/collections/postman">RyunaCDN.postman_collection.json</a></td>
      <td>File → Import → drop file JSON</td>
    </tr>
    <tr>
      <td><strong>Insomnia</strong></td>
      <td><a href="/collections/insomnia">RyunaCDN.insomnia.json</a></td>
      <td>Application → Preferences → Data → Import Data → From File</td>
    </tr>
    <tr>
      <td><strong>Bruno</strong></td>
      <td><a href="/collections/bruno">RyunaCDN.bruno.zip</a></td>
      <td>Unzip → Bruno → Open Collection → pilih folder <code>RyunaCDN/</code></td>
    </tr>
  </tbody>
</table>

<h3>Variable</h3>
<p>Semua ship dengan variable berikut — set dulu sebelum panggil endpoint yang protected:</p>
<table>
  <thead><tr><th>Variable</th><th>Default</th><th>Fungsi</th></tr></thead>
  <tbody>
    <tr><td><code>baseUrl</code></td><td><code>http://localhost:8080</code></td><td>API base URL</td></tr>
    <tr><td><code>clientId</code></td><td>(kosong)</td><td>Set sesuai <code>AUTH_CLIENT_ID</code></td></tr>
    <tr><td><code>secret</code></td><td>(kosong)</td><td>Set sesuai <code>AUTH_SECRET</code></td></tr>
    <tr><td><code>accessToken</code></td><td>(kosong)</td><td>Auto-populate oleh request "Get bearer token"</td></tr>
  </tbody>
</table>

<h3>Workflow</h3>
<ol>
  <li>Set <code>baseUrl</code>, <code>clientId</code>, <code>secret</code>.</li>
  <li>Jalankan <strong>Auth → Get bearer token</strong>. <code>accessToken</code> dari response auto-capture.</li>
  <li>Jalankan request apapun di folder <strong>Authenticated</strong> — bearer auto-attach.</li>
  <li>Untuk <strong>Multi-domain admin</strong>, aktifkan dulu <code>multiDomain.enabled=true</code> + <code>multiDomain.configurationApi=true</code> di server.</li>
</ol>`
    }
  },
  {
    id: 'troubleshooting',
    title: { en: 'Troubleshooting', id: 'Troubleshooting' },
    body: {
      en: `
<details>
  <summary><code>sharp</code> install fails</summary>
  <p>Make sure you're on Node 22 and pnpm 10. On Linux, install <code>libvips-dev</code> if prebuilt binary cannot be downloaded. Rebuild: <code>pnpm rebuild sharp</code>.</p>
</details>
<details>
  <summary>Puppeteer fails to launch Chromium</summary>
  <p>First run downloads ~150 MB of Chromium. If behind a proxy, set <code>HTTP_PROXY</code>. Manual install: <code>npx puppeteer browsers install chrome</code>. On Linux, you may need <code>libnss3 libatk-bridge2.0-0 libxss1 libasound2</code>.</p>
</details>
<details>
  <summary><code>EADDRINUSE</code> on start</summary>
  <p>Port already in use. Either kill the previous process (<code>pnpm prod:stop</code>) or change <code>PORT</code>.</p>
</details>
<details>
  <summary>Redis connection refused</summary>
  <p>Either start Redis (<code>redis-server</code>) or set <code>CACHE_ENABLE_REDIS=false</code> to fall back to disk.</p>
</details>
<details>
  <summary>S3 returns 403 / NoSuchBucket</summary>
  <p>Re-check <code>AWS_S3_IMAGES_REGION</code> and bucket policy. For DigitalOcean Spaces, set <code>AWS_S3_IMAGES_ENDPOINT</code> too.</p>
</details>
<details>
  <summary>JWT verify fails after restart</summary>
  <p><code>AUTH_KEY</code> changed between sessions. Issue a new token via <code>/token</code>.</p>
</details>
<details>
  <summary>Banner appears N times in cluster</summary>
  <p>Use <code>cluster: true</code> in config (one banner from primary) or run via PM2 (single primary controls workers).</p>
</details>`,
      id: `
<details>
  <summary><code>sharp</code> gagal install</summary>
  <p>Pastikan Node 22 dan pnpm 10. Di Linux, install <code>libvips-dev</code> kalau prebuilt tidak bisa di-download. Rebuild: <code>pnpm rebuild sharp</code>.</p>
</details>
<details>
  <summary>Puppeteer gagal launch Chromium</summary>
  <p>Run pertama download ~150 MB Chromium. Kalau di belakang proxy, set <code>HTTP_PROXY</code>. Install manual: <code>npx puppeteer browsers install chrome</code>. Di Linux mungkin butuh <code>libnss3 libatk-bridge2.0-0 libxss1 libasound2</code>.</p>
</details>
<details>
  <summary><code>EADDRINUSE</code> saat start</summary>
  <p>Port sudah dipakai. Kill process sebelumnya (<code>pnpm prod:stop</code>) atau ganti <code>PORT</code>.</p>
</details>
<details>
  <summary>Redis connection refused</summary>
  <p>Start Redis (<code>redis-server</code>) atau set <code>CACHE_ENABLE_REDIS=false</code> supaya fallback ke disk.</p>
</details>
<details>
  <summary>S3 return 403 / NoSuchBucket</summary>
  <p>Cek lagi <code>AWS_S3_IMAGES_REGION</code> dan policy bucket. Untuk DigitalOcean Spaces, set juga <code>AWS_S3_IMAGES_ENDPOINT</code>.</p>
</details>
<details>
  <summary>JWT verify gagal habis restart</summary>
  <p><code>AUTH_KEY</code> ganti antar session. Issue token baru via <code>/token</code>.</p>
</details>
<details>
  <summary>Banner muncul N kali di cluster</summary>
  <p>Pakai <code>cluster: true</code> di config (banner cuma dari primary) atau pakai PM2 (primary tunggal).</p>
</details>`
    }
  },
  {
    id: 'license',
    title: { en: 'License', id: 'Lisensi' },
    body: {
      en: `
<p>GPL-3.0-or-later. See <a href="https://github.com/aribrilliantsyah/ryuna-cdn/blob/main/GPL.md">GPL.md</a>. Originally derived from DADI CDN © DADI+ Limited; modifications © 2026 aribrilliantsyah.</p>`,
      id: `
<p>GPL-3.0-or-later. Lihat <a href="https://github.com/aribrilliantsyah/ryuna-cdn/blob/main/GPL.md">GPL.md</a>. Asal mula dari DADI CDN © DADI+ Limited; modifikasi © 2026 aribrilliantsyah.</p>`
    }
  }
]

export const i18n = {
  en: {
    title: 'RyunaCDN — Docs',
    homeTitle: 'RyunaCDN',
    tagline: 'Just-in-time image & asset CDN',
    cta: 'Read the docs →',
    docsHeading: 'Documentation',
    intro:
      'RyunaCDN is a just-in-time image &amp; asset CDN. Fork of <a href="https://github.com/dadi/cdn">DADI CDN</a>, rewritten in TypeScript on Node 22 + Fastify 5.',
    toc: 'Contents',
    home: 'Home',
    docs: 'Docs',
    status: 'Status',
    whatItDoes: 'What it does',
    tryIt: 'Try it',
    featImg: { title: 'Image transforms', body: 'Resize, crop, format convert (JPEG/PNG/WebP/AVIF/GIF), quality, gravity, smartcrop entropy, devicePixelRatio.' },
    featMin: { title: 'Asset minify', body: 'CSS via <code>lightningcss</code>, JS via <code>terser</code>. Cached output.' },
    featStore: { title: 'Multi-source storage', body: 'Disk, S3 / DigitalOcean Spaces / any S3-compatible, remote HTTP.' },
    featCache: { title: 'Cache', body: 'Disk (<code>cacache</code>) or Redis (<code>ioredis</code>). Cron auto-flush, CloudFront sync.' },
    featAuth: { title: 'Auth', body: 'JWT bearer on <code>/api/*</code>. <code>POST /token</code> with clientId + secret.' },
    featUpload: { title: 'Upload & PDF', body: 'Multipart image &amp; asset upload with MIME sniff. URL → PDF via Puppeteer.' }
  },
  id: {
    title: 'RyunaCDN — Docs',
    homeTitle: 'RyunaCDN',
    tagline: 'CDN image & asset just-in-time',
    cta: 'Baca dokumentasi →',
    docsHeading: 'Dokumentasi',
    intro:
      'RyunaCDN adalah CDN image &amp; asset just-in-time. Fork dari <a href="https://github.com/dadi/cdn">DADI CDN</a>, ditulis ulang di TypeScript di atas Node 22 + Fastify 5.',
    toc: 'Daftar isi',
    home: 'Home',
    docs: 'Docs',
    status: 'Status',
    whatItDoes: 'Fitur',
    tryIt: 'Coba',
    featImg: { title: 'Transform image', body: 'Resize, crop, konversi format (JPEG/PNG/WebP/AVIF/GIF), quality, gravity, smartcrop entropy, devicePixelRatio.' },
    featMin: { title: 'Minify asset', body: 'CSS pakai <code>lightningcss</code>, JS pakai <code>terser</code>. Output di-cache.' },
    featStore: { title: 'Storage multi-source', body: 'Disk, S3 / DigitalOcean Spaces / S3-compatible, remote HTTP.' },
    featCache: { title: 'Cache', body: 'Disk (<code>cacache</code>) atau Redis (<code>ioredis</code>). Cron auto-flush, sync CloudFront.' },
    featAuth: { title: 'Auth', body: 'JWT bearer di <code>/api/*</code>. <code>POST /token</code> pakai clientId + secret.' },
    featUpload: { title: 'Upload & PDF', body: 'Upload image &amp; asset multipart dengan MIME sniff. URL → PDF via Puppeteer.' }
  }
} as const

export type I18n = typeof i18n.en
