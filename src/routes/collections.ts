import type { FastifyInstance } from 'fastify'
import JSZip from 'jszip'

export interface Endpoint {
  folder: 'Public' | 'Auth' | 'Authenticated' | 'Multi-domain admin'
  name: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  path: string
  description?: string
  body?: unknown
  multipart?: Array<{ name: string; type: 'file' | 'text'; value?: string }>
  bearer?: boolean
  captureToken?: boolean
}

export const endpoints: Endpoint[] = [
  // ─── Public ────────────────────────────────────────────────────────────────
  {
    folder: 'Public',
    name: 'Welcome',
    method: 'GET',
    path: '/',
    description: 'Landing HTML page'
  },
  {
    folder: 'Public',
    name: 'Docs (EN)',
    method: 'GET',
    path: '/docs',
    description: 'Full documentation page'
  },
  {
    folder: 'Public',
    name: 'Docs (ID)',
    method: 'GET',
    path: '/docs?lang=id',
    description: 'Dokumentasi versi Indonesia'
  },
  {
    folder: 'Public',
    name: 'Robots.txt',
    method: 'GET',
    path: '/robots.txt',
    description: 'Crawler deny-all'
  },
  {
    folder: 'Public',
    name: 'Serve raw image',
    method: 'GET',
    path: '/example.jpg',
    description: 'Untransformed image from storage'
  },
  {
    folder: 'Public',
    name: 'Transform image (resize + format)',
    method: 'GET',
    path: '/example.jpg?width=400&height=300&format=webp&quality=80',
    description: 'On-the-fly transform: resize + WebP convert'
  },
  {
    folder: 'Public',
    name: 'Transform image (smartcrop)',
    method: 'GET',
    path: '/example.jpg?width=300&height=300&resize=entropy',
    description: 'Smart crop using entropy detection'
  },
  {
    folder: 'Public',
    name: 'Image metadata + palette (JSON)',
    method: 'GET',
    path: '/example.jpg?format=json',
    description: 'Returns dimensions + EXIF + color palette'
  },
  {
    folder: 'Public',
    name: 'Apply recipe preset',
    method: 'GET',
    path: '/thumb/example.jpg',
    description: 'Apply workspace/recipes/thumb.json'
  },
  {
    folder: 'Public',
    name: 'Upload image',
    method: 'POST',
    path: '/upload_image',
    description: 'Multipart image upload + optional path sub-dir',
    multipart: [
      { name: 'image', type: 'file' },
      { name: 'path', type: 'text', value: '2026/jan' }
    ]
  },
  {
    folder: 'Public',
    name: 'Upload asset',
    method: 'POST',
    path: '/upload_file',
    description: 'Multipart asset (non-image) upload',
    multipart: [
      { name: 'asset', type: 'file' },
      { name: 'path', type: 'text', value: 'docs' }
    ]
  },
  {
    folder: 'Public',
    name: 'Delete image',
    method: 'DELETE',
    path: '/delete_image',
    description: 'Remove uploaded image',
    body: { filename: '1780137107476-photo.jpg', path: '2026/jan' }
  },
  {
    folder: 'Public',
    name: 'Delete asset',
    method: 'DELETE',
    path: '/delete_asset',
    description: 'Remove uploaded asset',
    body: { filename: 'brochure.pdf', path: 'docs' }
  },
  {
    folder: 'Public',
    name: 'Page to PDF',
    method: 'POST',
    path: '/page_to_pdf',
    description: 'Render URL → PDF via Puppeteer',
    body: {
      url: 'https://example.com',
      filename: 'export.pdf',
      format: 'A4',
      landscape: false
    }
  },

  // ─── Auth: get token ───────────────────────────────────────────────────────
  {
    folder: 'Auth',
    name: 'Get bearer token',
    method: 'POST',
    path: '/token',
    description:
      'Exchange clientId + secret for a JWT. Token is auto-captured into {{accessToken}}.',
    body: { clientId: '{{clientId}}', secret: '{{secret}}' },
    captureToken: true
  },

  // ─── Authenticated (Bearer) ────────────────────────────────────────────────
  {
    folder: 'Authenticated',
    name: 'Cache flush',
    method: 'POST',
    path: '/api/flush',
    description:
      'Invalidate cache. Pattern: "*" all, "/path" exact, "/prefix/*" prefix.',
    body: { pattern: '*' },
    bearer: true
  },
  {
    folder: 'Authenticated',
    name: 'Define recipe',
    method: 'POST',
    path: '/api/recipes',
    description: 'Register a new preset recipe at runtime',
    body: {
      recipe: 'thumb',
      path: '/uploads',
      settings: {
        format: 'webp',
        quality: 75,
        width: 300,
        height: 300,
        resizeStyle: 'aspectfill'
      }
    },
    bearer: true
  },
  {
    folder: 'Authenticated',
    name: 'Define route',
    method: 'POST',
    path: '/api/routes',
    description: 'Register conditional recipe routing',
    body: {
      route: 'responsive',
      branches: [
        { condition: { device: 'mobile' }, recipe: 'thumb-mobile' },
        { condition: { device: 'tablet' }, recipe: 'thumb-tablet' },
        { recipe: 'thumb' }
      ]
    },
    bearer: true
  },
  {
    folder: 'Authenticated',
    name: 'Health status',
    method: 'POST',
    path: '/api/status',
    description: 'Run configured probe routes and return status',
    bearer: true
  },

  // ─── Multi-domain admin (no auth, gated by multiDomain.configurationApi) ──
  {
    folder: 'Multi-domain admin',
    name: 'Add domains',
    method: 'POST',
    path: '/_ryunacdn/domains',
    description:
      'Bulk register per-host configs. Requires multiDomain.enabled + multiDomain.configurationApi.',
    body: [{ domain: 'cdn.example.com', data: {} }]
  },
  {
    folder: 'Multi-domain admin',
    name: 'Update domain',
    method: 'PUT',
    path: '/_ryunacdn/domains/cdn.example.com',
    description: 'Replace a domain config',
    body: { data: { caching: { ttl: 1800 } } }
  },
  {
    folder: 'Multi-domain admin',
    name: 'Delete domain',
    method: 'DELETE',
    path: '/_ryunacdn/domains/cdn.example.com',
    description: 'Remove a domain from runtime'
  }
]

// ─── Postman v2.1 ────────────────────────────────────────────────────────────

function postmanRequest(ep: Endpoint): Record<string, unknown> {
  const [pathOnly, query] = ep.path.split('?')
  const pathSegments = (pathOnly ?? '').replace(/^\//, '').split('/').filter(Boolean)
  const url: Record<string, unknown> = {
    raw: `{{baseUrl}}${ep.path}`,
    host: ['{{baseUrl}}'],
    path: pathSegments
  }
  if (query) {
    url.query = query.split('&').map((q) => {
      const [key, value] = q.split('=')
      return { key, value: value ?? '' }
    })
  }
  const request: Record<string, unknown> = { method: ep.method, header: [], url }
  if (ep.bearer) {
    request.auth = {
      type: 'bearer',
      bearer: [{ key: 'token', value: '{{accessToken}}', type: 'string' }]
    }
  }
  if (ep.body !== undefined) {
    ;(request.header as Array<Record<string, string>>).push({
      key: 'Content-Type',
      value: 'application/json'
    })
    request.body = {
      mode: 'raw',
      raw: JSON.stringify(ep.body, null, 2),
      options: { raw: { language: 'json' } }
    }
  }
  if (ep.multipart) {
    request.body = {
      mode: 'formdata',
      formdata: ep.multipart.map((m) => ({
        key: m.name,
        type: m.type === 'file' ? 'file' : 'text',
        ...(m.type === 'text' ? { value: m.value ?? '' } : { src: '' })
      }))
    }
  }
  if (ep.description) request.description = ep.description

  const item: Record<string, unknown> = { name: ep.name, request, response: [] }
  if (ep.captureToken) {
    item.event = [
      {
        listen: 'test',
        script: {
          exec: [
            'if (pm.response.code === 200) {',
            '  var data = pm.response.json();',
            '  pm.collectionVariables.set("accessToken", data.accessToken);',
            '  console.log("✅ token captured");',
            '}'
          ],
          type: 'text/javascript'
        }
      }
    ]
  }
  return item
}

function buildPostman(): Record<string, unknown> {
  const folders = new Map<string, Array<Record<string, unknown>>>()
  for (const ep of endpoints) {
    if (!folders.has(ep.folder)) folders.set(ep.folder, [])
    folders.get(ep.folder)!.push(postmanRequest(ep))
  }
  return {
    info: {
      _postman_id: 'ryunacdn-collection',
      name: 'RyunaCDN',
      description:
        'RyunaCDN — just-in-time image & asset CDN. Folders: Public (no auth), Auth (get token), Authenticated (bearer required), Multi-domain admin (open if configurationApi enabled).',
      schema:
        'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      _exporter_id: 'ryunacdn'
    },
    item: [...folders.entries()].map(([name, item]) => ({ name, item })),
    variable: [
      { key: 'baseUrl', value: 'http://localhost:8080', type: 'string' },
      { key: 'clientId', value: '', type: 'string' },
      { key: 'secret', value: '', type: 'string' },
      { key: 'accessToken', value: '', type: 'string' }
    ]
  }
}

// ─── Insomnia v4 ─────────────────────────────────────────────────────────────

function insomniaRequest(
  ep: Endpoint,
  parentId: string,
  id: string
): Record<string, unknown> {
  const req: Record<string, unknown> = {
    _id: id,
    _type: 'request',
    parentId,
    name: ep.name,
    description: ep.description ?? '',
    method: ep.method,
    url: `{{ _.baseUrl }}${ep.path}`,
    headers: [] as Array<Record<string, string>>,
    parameters: [],
    body: {} as Record<string, unknown>,
    authentication: {} as Record<string, unknown>
  }
  if (ep.bearer) {
    req.authentication = { type: 'bearer', token: '{{ _.accessToken }}' }
  }
  if (ep.body !== undefined) {
    ;(req.headers as Array<Record<string, string>>).push({
      name: 'Content-Type',
      value: 'application/json'
    })
    req.body = {
      mimeType: 'application/json',
      text: JSON.stringify(ep.body, null, 2)
    }
  }
  if (ep.multipart) {
    req.body = {
      mimeType: 'multipart/form-data',
      params: ep.multipart.map((m) => ({
        name: m.name,
        type: m.type === 'file' ? 'file' : 'text',
        ...(m.type === 'text' ? { value: m.value ?? '' } : { fileName: '' })
      }))
    }
  }
  return req
}

function buildInsomnia(): Record<string, unknown> {
  const wrkId = 'wrk_ryunacdn'
  const envBaseId = 'env_ryunacdn_base'
  const folderIds: Record<string, string> = {}
  const resources: Array<Record<string, unknown>> = [
    {
      _id: wrkId,
      _type: 'workspace',
      parentId: null,
      name: 'RyunaCDN',
      description:
        'RyunaCDN API collection. Folders: Public (no auth), Auth (get token), Authenticated (bearer), Multi-domain admin (open if enabled).',
      scope: 'collection'
    },
    {
      _id: envBaseId,
      _type: 'environment',
      parentId: wrkId,
      name: 'Base',
      data: {
        baseUrl: 'http://localhost:8080',
        clientId: '',
        secret: '',
        accessToken: ''
      },
      dataPropertyOrder: { '&': ['baseUrl', 'clientId', 'secret', 'accessToken'] },
      color: null,
      isPrivate: false
    }
  ]

  let reqCounter = 0
  for (const ep of endpoints) {
    if (!folderIds[ep.folder]) {
      const fid = `fld_${ep.folder.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`
      folderIds[ep.folder] = fid
      resources.push({
        _id: fid,
        _type: 'request_group',
        parentId: wrkId,
        name: ep.folder,
        description: ''
      })
    }
    resources.push(
      insomniaRequest(ep, folderIds[ep.folder]!, `req_ryunacdn_${++reqCounter}`)
    )
  }

  return {
    _type: 'export',
    __export_format: 4,
    __export_date: new Date().toISOString(),
    __export_source: 'ryunacdn',
    resources
  }
}

// ─── Bruno (folder of .bru files + collection.bru + environments) ────────────

function bruRequest(ep: Endpoint, seq: number): string {
  const method = ep.method.toLowerCase()
  const lines: string[] = []
  lines.push(`meta {`)
  lines.push(`  name: ${ep.name}`)
  lines.push(`  type: http`)
  lines.push(`  seq: ${seq}`)
  lines.push(`}`)
  lines.push('')
  lines.push(`${method} {`)
  lines.push(`  url: {{baseUrl}}${ep.path}`)
  lines.push(`  body: ${ep.body !== undefined ? 'json' : ep.multipart ? 'multipartForm' : 'none'}`)
  lines.push(`  auth: ${ep.bearer ? 'bearer' : 'none'}`)
  lines.push(`}`)
  lines.push('')
  if (ep.bearer) {
    lines.push(`auth:bearer {`)
    lines.push(`  token: {{accessToken}}`)
    lines.push(`}`)
    lines.push('')
  }
  if (ep.body !== undefined) {
    lines.push(`body:json {`)
    lines.push(JSON.stringify(ep.body, null, 2).split('\n').map((l) => `  ${l}`).join('\n'))
    lines.push(`}`)
    lines.push('')
  }
  if (ep.multipart) {
    lines.push(`body:multipart-form {`)
    for (const m of ep.multipart) {
      if (m.type === 'file') {
        lines.push(`  ${m.name}: @file()`)
      } else {
        lines.push(`  ${m.name}: ${m.value ?? ''}`)
      }
    }
    lines.push(`}`)
    lines.push('')
  }
  if (ep.captureToken) {
    lines.push(`script:post-response {`)
    lines.push(`  if (res.getStatus() === 200) {`)
    lines.push(`    const data = res.getBody();`)
    lines.push(`    bru.setVar("accessToken", data.accessToken);`)
    lines.push(`  }`)
    lines.push(`}`)
    lines.push('')
  }
  if (ep.description) {
    lines.push(`docs {`)
    lines.push(`  ${ep.description}`)
    lines.push(`}`)
    lines.push('')
  }
  return lines.join('\n')
}

async function buildBrunoZip(): Promise<Buffer> {
  const zip = new JSZip()
  const root = zip.folder('RyunaCDN')!

  root.file(
    'bruno.json',
    JSON.stringify(
      {
        version: '1',
        name: 'RyunaCDN',
        type: 'collection',
        ignore: ['node_modules', '.git']
      },
      null,
      2
    )
  )

  root.file(
    'collection.bru',
    [
      `meta {`,
      `  name: RyunaCDN`,
      `}`,
      ``,
      `docs {`,
      `  RyunaCDN — just-in-time image & asset CDN. Folders: Public, Auth, Authenticated, Multi-domain admin.`,
      `}`,
      ``
    ].join('\n')
  )

  const env = root.folder('environments')!
  env.file(
    'Local.bru',
    [
      `vars {`,
      `  baseUrl: http://localhost:8080`,
      `  clientId: `,
      `  secret: `,
      `  accessToken: `,
      `}`,
      ``
    ].join('\n')
  )

  const seqByFolder: Record<string, number> = {}
  for (const ep of endpoints) {
    const folder = root.folder(ep.folder)!
    seqByFolder[ep.folder] = (seqByFolder[ep.folder] ?? 0) + 1
    const safeName = ep.name.replace(/[\\/:*?"<>|]/g, '-')
    folder.file(`${safeName}.bru`, bruRequest(ep, seqByFolder[ep.folder]!))
  }

  return zip.generateAsync({ type: 'nodebuffer' })
}

// ─── Route registration ──────────────────────────────────────────────────────

export function collectionRoutes(app: FastifyInstance): void {
  app.get('/collections/postman', async (_req, reply) =>
    reply
      .type('application/json; charset=utf-8')
      .header('Content-Disposition', 'attachment; filename="RyunaCDN.postman_collection.json"')
      .send(JSON.stringify(buildPostman(), null, 2))
  )

  app.get('/collections/insomnia', async (_req, reply) =>
    reply
      .type('application/json; charset=utf-8')
      .header('Content-Disposition', 'attachment; filename="RyunaCDN.insomnia.json"')
      .send(JSON.stringify(buildInsomnia(), null, 2))
  )

  app.get('/collections/bruno', async (_req, reply) => {
    const buf = await buildBrunoZip()
    return reply
      .type('application/zip')
      .header('Content-Disposition', 'attachment; filename="RyunaCDN.bruno.zip"')
      .send(buf)
  })
}
