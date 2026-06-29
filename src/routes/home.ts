import type { FastifyInstance, FastifyRequest } from 'fastify'
import { config } from '../config/index.js'
import { endpoints } from './collections.js'
import { i18n, type Lang, sections } from './docs-content.js'

const VERSION = '1.0.0'
const AUTHOR = 'aribrilliantsyah'
const NO_INDEX = 'noindex, nofollow, noarchive, nosnippet'

const baseStyles = `
  :root {
    color-scheme: light dark;
    --bg: #0d1117;
    --bg-soft: #0a0d12;
    --surface: #161b22;
    --border: #30363d;
    --text: #e6edf3;
    --muted: #8b949e;
    --accent: #f78166;
    --accent-2: #d2a8ff;
    --code-bg: #1f2428;
    --link: #58a6ff;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; scroll-padding-top: 80px; }
  body { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; background: var(--bg); color: var(--text); line-height: 1.6; }
  a { color: var(--link); text-decoration: none; }
  a:hover { text-decoration: underline; }
  code, pre { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.92em; }
  code { background: var(--code-bg); padding: 0.15em 0.4em; border-radius: 4px; }
  pre { background: var(--code-bg); padding: 1rem; border-radius: 8px; overflow-x: auto; border: 1px solid var(--border); margin: 0.75rem 0 1.25rem; }
  pre code { background: transparent; padding: 0; }
  h1, h2, h3 { line-height: 1.25; }
  h1 { font-size: 2rem; margin-bottom: 1rem; }
  h2 { font-size: 1.5rem; margin: 2.5rem 0 0.75rem; padding-bottom: 0.35rem; border-bottom: 1px solid var(--border); scroll-margin-top: 80px; }
  h3 { font-size: 1.15rem; margin: 1.5rem 0 0.5rem; color: var(--accent-2); }
  p, ul, ol { margin-bottom: 1rem; }
  ul, ol { padding-left: 1.5rem; }
  li { margin-bottom: 0.25rem; }
  table { border-collapse: collapse; width: 100%; margin: 0.5rem 0 1.5rem; font-size: 0.95em; }
  th, td { border: 1px solid var(--border); padding: 0.5rem 0.75rem; text-align: left; vertical-align: top; }
  th { background: var(--surface); }
  details { margin: 0.5rem 0 1rem; border: 1px solid var(--border); border-radius: 6px; padding: 0.5rem 0.85rem; background: var(--surface); }
  summary { cursor: pointer; color: var(--accent-2); font-weight: 500; }
  details[open] summary { margin-bottom: 0.5rem; }

  /* nav */
  .nav { position: sticky; top: 0; z-index: 10; display: flex; gap: 1.5rem; padding: 1rem 1.5rem; background: rgba(13,17,23,0.85); backdrop-filter: blur(8px); border-bottom: 1px solid var(--border); align-items: center; }
  .nav .brand { font-weight: 700; color: var(--accent); font-size: 1.1rem; }
  .nav .brand .v { color: var(--muted); font-weight: 400; margin-left: 0.4rem; font-size: 0.85rem; }
  .nav a { color: var(--text); }
  .nav a:hover { color: var(--accent); text-decoration: none; }
  .nav .spacer { flex: 1; }
  .nav a.active { color: var(--accent); }
  .lang { display: inline-flex; gap: 0.35rem; padding: 0.2rem 0.45rem; background: var(--surface); border: 1px solid var(--border); border-radius: 5px; font-size: 0.85em; }
  .lang a { padding: 0 0.35rem; color: var(--muted); }
  .lang a.active { color: var(--text); font-weight: 600; }

  /* layout */
  .shell { max-width: 1200px; margin: 0 auto; padding: 2rem 1.5rem; }
  .docs-layout { display: grid; grid-template-columns: 240px 1fr; gap: 2.5rem; align-items: start; }
  .toc { position: sticky; top: 80px; max-height: calc(100vh - 100px); overflow-y: auto; padding-right: 0.5rem; font-size: 0.93em; }
  .toc h3 { color: var(--muted); font-size: 0.78em; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 0.75rem; }
  .toc ul { list-style: none; padding: 0; margin: 0; border-left: 1px solid var(--border); }
  .toc li { margin: 0; }
  .toc a { display: block; padding: 0.35rem 0.85rem; color: var(--muted); border-left: 2px solid transparent; margin-left: -1px; }
  .toc a:hover { color: var(--text); text-decoration: none; }
  .toc a.active { color: var(--accent); border-left-color: var(--accent); }
  .docs-content section { margin-bottom: 2rem; }

  /* home hero */
  .hero { padding: 3rem 0 2rem; text-align: center; }
  .hero pre { display: inline-block; text-align: left; margin: 0 auto 1.5rem; }
  .hero .tag { color: var(--muted); margin-top: 0.5rem; }
  .badge { display: inline-block; padding: 0.15em 0.55em; border-radius: 999px; background: var(--surface); border: 1px solid var(--border); color: var(--muted); font-size: 0.8em; margin: 0 0.2rem; }
  .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin: 1rem 0 2rem; }
  .card { padding: 1rem 1.25rem; background: var(--surface); border: 1px solid var(--border); border-radius: 8px; }
  .card h3 { margin: 0 0 0.4rem; font-size: 1rem; color: var(--accent); }
  .card p { color: var(--muted); margin: 0; font-size: 0.92em; }
  .cta { display: inline-block; padding: 0.6rem 1.2rem; background: var(--accent); color: #000; border-radius: 6px; font-weight: 600; margin-top: 1rem; }
  .cta:hover { text-decoration: none; opacity: 0.9; }
  .footer { margin-top: 3rem; padding-top: 1.5rem; border-top: 1px solid var(--border); color: var(--muted); font-size: 0.9em; text-align: center; }
  .method { display: inline-block; padding: 0.1em 0.5em; border-radius: 4px; font-size: 0.75em; font-weight: 700; vertical-align: middle; }
  .m-get { background: #1f6feb; color: #fff; }
  .m-post { background: #2ea043; color: #fff; }
  .m-delete { background: #da3633; color: #fff; }

  @media (max-width: 900px) {
    .docs-layout { grid-template-columns: 1fr; }
    .toc { position: static; max-height: none; border-bottom: 1px solid var(--border); padding-bottom: 1rem; margin-bottom: 1.5rem; }
    .toc ul { border-left: none; display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 0.25rem; }
  }
`

const scrollSpyJs = `
  const links = document.querySelectorAll('.toc a');
  const sections = Array.from(document.querySelectorAll('.docs-content section[id]'));
  function activate() {
    const y = window.scrollY + 100;
    let active = sections[0];
    for (const s of sections) if (s.offsetTop <= y) active = s;
    links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + active.id));
  }
  window.addEventListener('scroll', activate, { passive: true });
  activate();
`

const nav = (active: 'home' | 'docs', lang: Lang): string => {
  const t = i18n[lang]
  const langSwitch = (l: Lang) =>
    `<a href="?lang=${l}" class="${lang === l ? 'active' : ''}">${l.toUpperCase()}</a>`
  return `
  <nav class="nav">
    <span class="brand">RyunaCDN<span class="v">v${VERSION}</span></span>
    <div class="spacer"></div>
    <a href="/?lang=${lang}" class="${active === 'home' ? 'active' : ''}">${t.home}</a>
    <a href="/docs?lang=${lang}" class="${active === 'docs' ? 'active' : ''}">${t.docs}</a>
    <span class="lang">${langSwitch('en')}${langSwitch('id')}</span>
  </nav>`
}

const footer = (): string => `
  <footer class="footer">
    RyunaCDN v${VERSION} · by <a href="https://github.com/${AUTHOR}">${AUTHOR}</a> ·
    Fork of <a href="https://github.com/dadi/cdn">DADI CDN</a> · GPL-3.0
  </footer>`

const homePage = (lang: Lang): string => {
  const t = i18n[lang]
  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="${NO_INDEX}">
  <meta name="googlebot" content="noindex, nofollow">
  <title>${t.homeTitle}</title>
  <style>${baseStyles}</style>
</head>
<body>
  ${nav('home', lang)}
  <main class="shell">
    <section class="hero">
      <pre><code>    ╱|、
   (˚ˎ 。7      <strong style="color:var(--accent)">RyunaCDN</strong> <span style="color:var(--muted)">v${VERSION}</span>
    |、˜〵      <span style="color:var(--muted)">by ${AUTHOR}</span>
    じしˍ,)ノ</code></pre>
      <h1>${t.tagline}</h1>
      <p class="tag">
        <span class="badge">Node 22+</span>
        <span class="badge">TypeScript</span>
        <span class="badge">Fastify 5</span>
        <span class="badge">sharp 0.34</span>
        <span class="badge">GPL-3.0</span>
      </p>
      <a class="cta" href="/docs?lang=${lang}">${t.cta}</a>
    </section>

    <h2>${t.whatItDoes}</h2>
    <div class="grid">
      <div class="card"><h3>🖼️ ${t.featImg.title}</h3><p>${t.featImg.body}</p></div>
      <div class="card"><h3>📦 ${t.featMin.title}</h3><p>${t.featMin.body}</p></div>
      <div class="card"><h3>☁️ ${t.featStore.title}</h3><p>${t.featStore.body}</p></div>
      <div class="card"><h3>⚡ ${t.featCache.title}</h3><p>${t.featCache.body}</p></div>
      <div class="card"><h3>🔐 ${t.featAuth.title}</h3><p>${t.featAuth.body}</p></div>
      <div class="card"><h3>📤 ${t.featUpload.title}</h3><p>${t.featUpload.body}</p></div>
    </div>

    <h2>${t.tryIt}</h2>
    <pre><code>curl http://localhost:8080/
curl http://localhost:8080/cat.jpg
curl 'http://localhost:8080/cat.jpg?width=400&amp;height=300&amp;format=webp'</code></pre>

    ${footer()}
  </main>
</body>
</html>`
}

const docsPage = (lang: Lang): string => {
  const t = i18n[lang]
  const tocLinks = sections
    .map((s) => `<li><a href="#${s.id}">${s.title[lang]}</a></li>`)
    .join('')
  const sectionsHtml = sections
    .map(
      (s) =>
        `<section id="${s.id}"><h2>${s.title[lang]}</h2>${s.body[lang]}</section>`
    )
    .join('')
  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="robots" content="${NO_INDEX}">
  <meta name="googlebot" content="noindex, nofollow">
  <title>${t.title}</title>
  <style>${baseStyles}</style>
</head>
<body>
  ${nav('docs', lang)}
  <main class="shell">
    <h1>${t.docsHeading}</h1>
    <p>${t.intro}</p>

    <div class="docs-layout">
      <aside class="toc">
        <h3>${t.toc}</h3>
        <ul>${tocLinks}</ul>
      </aside>
      <div class="docs-content">
        ${sectionsHtml}
      </div>
    </div>

    ${footer()}
  </main>
  <script>${scrollSpyJs}</script>
</body>
</html>`
}

function pickLang(query: unknown): Lang {
  const q = (query as { lang?: string } | undefined)?.lang
  return q === 'id' ? 'id' : 'en'
}

// Browser sends Accept: text/html,... → render HTML.
// curl / Postman / Insomnia / Bruno / fetch defaults send Accept: any
// or application/json → render JSON.
function wantsHtml(req: FastifyRequest): boolean {
  const accept = (req.headers.accept ?? '').toLowerCase()
  if (accept.includes('application/json')) return false
  return accept.includes('text/html')
}

function homeJson(): Record<string, unknown> {
  return {
    name: 'RyunaCDN',
    version: VERSION,
    author: AUTHOR,
    tagline: 'Just-in-time image & asset CDN',
    message:
      'This is a JSON response because your client did not request text/html. Open this URL in a browser for the HTML landing page.',
    links: {
      home_html: '/',
      docs_html: '/docs',
      docs_html_id: '/docs?lang=id',
      collections: {
        postman: '/collections/postman',
        insomnia: '/collections/insomnia',
        bruno: '/collections/bruno'
      },
      robots: '/robots.txt'
    },
    source: 'https://github.com/aribrilliantsyah/ryuna-cdn',
    license: 'GPL-3.0-or-later'
  }
}

function docsJson(lang: Lang): Record<string, unknown> {
  return {
    name: 'RyunaCDN',
    version: VERSION,
    author: AUTHOR,
    lang,
    message:
      'This is a JSON response because your client did not request text/html. Open this URL in a browser for the full HTML documentation.',
    html_pages: {
      en: '/docs',
      id: '/docs?lang=id'
    },
    collections: {
      postman: '/collections/postman',
      insomnia: '/collections/insomnia',
      bruno: '/collections/bruno'
    },
    sections: sections.map((s) => ({
      id: s.id,
      title: s.title[lang],
      html_url: `/docs?lang=${lang}#${s.id}`
    })),
    endpoints: endpoints.map((e) => ({
      folder: e.folder,
      name: e.name,
      method: e.method,
      path: e.path,
      auth: e.bearer ? 'bearer' : 'none',
      description: e.description ?? null
    }))
  }
}

export function homeRoutes(app: FastifyInstance): void {
  void config

  app.get('/', async (req, reply) => {
    reply.header('X-Robots-Tag', NO_INDEX)
    if (wantsHtml(req)) {
      return reply
        .type('text/html; charset=utf-8')
        .send(homePage(pickLang(req.query)))
    }
    return reply.type('application/json; charset=utf-8').send(homeJson())
  })

  app.get('/docs', async (req, reply) => {
    reply.header('X-Robots-Tag', NO_INDEX)
    if (wantsHtml(req)) {
      return reply
        .type('text/html; charset=utf-8')
        .send(docsPage(pickLang(req.query)))
    }
    return reply
      .type('application/json; charset=utf-8')
      .send(docsJson(pickLang(req.query)))
  })

  app.get('/robots.txt', async (_req, reply) =>
    reply
      .type('text/plain; charset=utf-8')
      .header('X-Robots-Tag', NO_INDEX)
      .send('User-agent: *\nDisallow: /\n')
  )
}
