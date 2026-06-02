import compress from '@fastify/compress'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import sensible from '@fastify/sensible'
import Fastify, { type FastifyBaseLogger, type FastifyInstance } from 'fastify'
import fs from 'node:fs'
import { registerAuth } from './auth.js'
import { config } from './config/index.js'
import { startFrequencyCache, stopFrequencyCache } from './cron.js'
import { domainManager } from './domain-manager.js'
import { createLogger, rootLogger } from './logger.js'
import { registerRoutes } from './routes/index.js'
import { workspace } from './workspace/index.js'

const log = createLogger('Server')
type App = FastifyInstance

function readFileSyncSafe(p: string): Buffer | null {
  try {
    return fs.readFileSync(p)
  } catch (err) {
    log.warn({ err, file: p }, 'failed to read SSL file')
    return null
  }
}

function buildHttpsOptions(): Record<string, unknown> {
  const opts: Record<string, unknown> = {
    key: readFileSyncSafe(config.get<string>('server.sslPrivateKeyPath')),
    cert: readFileSyncSafe(config.get<string>('server.sslCertificatePath'))
  }
  const passphrase = config.get<string>('server.sslPassphrase')
  if (passphrase && passphrase.length >= 4) opts.passphrase = passphrase

  const caPaths = config.get<string[]>('server.sslIntermediateCertificatePaths') ?? []
  const caPath = config.get<string>('server.sslIntermediateCertificatePath')
  if (caPaths.length) {
    opts.ca = caPaths.map((p) => readFileSyncSafe(p)).filter(Boolean)
  } else if (caPath) {
    opts.ca = readFileSyncSafe(caPath)
  }
  return opts
}

export async function buildServer(): Promise<App> {
  const protocol = config.get<string>('server.protocol')
  const isHttps = protocol === 'https'
  const useHttp2 = isHttps && config.get<boolean>('server.enableHTTP2')

  const httpLog = createLogger('HTTP')
  const baseOpts = {
    loggerInstance: rootLogger as unknown as FastifyBaseLogger,
    trustProxy: true,
    bodyLimit: 50 * 1024 * 1024,
    disableRequestLogging: true,
    connectionTimeout: Number(process.env.RYUNACDN_CONNECTION_TIMEOUT_MS ?? 60_000),
    requestTimeout: Number(process.env.RYUNACDN_REQUEST_TIMEOUT_MS ?? 120_000),
    keepAliveTimeout: Number(process.env.RYUNACDN_KEEPALIVE_TIMEOUT_MS ?? 5_000)
  }

  let app: App
  if (isHttps) {
    const httpsOpts = buildHttpsOptions()
    if (useHttp2) {
      app = Fastify({
        ...baseOpts,
        http2: true,
        https: { allowHTTP1: true, ...httpsOpts }
      }) as unknown as App
    } else {
      app = Fastify({ ...baseOpts, https: httpsOpts }) as unknown as App
    }
  } else {
    app = Fastify(baseOpts)
  }

  app.decorateRequest('ctx', undefined as never)
  app.addHook('onRequest', async (req) => {
    const host = (req.headers.host ?? '').split(':')[0]
    req.ctx = { domain: host || undefined }

    if (config.get<boolean>('multiDomain.enabled')) {
      if (!config.get<boolean>('multiDomain.configurationApi') && !domainManager.getDomain(host ?? '')) {
        throw Object.assign(new Error(`Domain not configured: ${host}`), { statusCode: 404 })
      }
    }
  })

  app.addHook('onSend', async (_req, reply, payload) => {
    reply.header('Access-Control-Allow-Origin', '*')
    reply.header('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet')
    return payload
  })

  app.addHook('onResponse', async (req, reply) => {
    const ms = Number(reply.elapsedTime ?? 0).toFixed(1)
    const status = reply.statusCode
    const emoji = status >= 500 ? '💥' : status >= 400 ? '⚠️' : status >= 300 ? '↪️' : '✅'
    httpLog.info(`${emoji} ${req.method} ${req.url} ${status} ${ms}ms`)
  })

  await app.register(sensible)
  await app.register(cors, { origin: '*' })
  if (config.get<boolean>('headers.useGzipCompression')) {
    await app.register(compress, { global: true, encodings: ['gzip'] })
  }
  await app.register(multipart, {
    limits: {
      fileSize: Number(process.env.RYUNACDN_UPLOAD_MAX_BYTES ?? 10 * 1024 * 1024),
      files: Number(process.env.RYUNACDN_UPLOAD_MAX_FILES ?? 1),
      fields: Number(process.env.RYUNACDN_UPLOAD_MAX_FIELDS ?? 5),
      fieldNameSize: 100,
      fieldSize: 1024,
      headerPairs: 100
    }
  })

  registerAuth(app)
  registerRoutes(app)

  app.setErrorHandler((err: Error & { statusCode?: number }, _req, reply) => {
    const status = err.statusCode ?? 500
    reply.code(status).send({
      statusCode: status,
      message: err.message,
      success: false
    })
  })

  return app
}

export async function startServer(): Promise<App> {
  const app = await buildServer()
  await workspace.build()
  workspace.startWatching()
  startFrequencyCache()

  const port = config.get<number>('server.port')
  const host = config.get<string>('server.host')
  await app.listen({ port, host })

  const redirectPort = config.get<number>('server.redirectPort')
  if (redirectPort > 0) {
    const { createServer } = await import('node:http')
    const httpsPort = config.get<number>('server.port')
    const redirect = createServer((req, res) => {
      const hostname = (req.headers.host ?? '').split(':')[0]
      res.statusCode = 301
      res.setHeader('Location', `https://${hostname}:${httpsPort}${req.url ?? '/'}`)
      res.end()
    })
    redirect.listen(redirectPort, () => {
      log.info({ port: redirectPort }, '🔁 HTTP→HTTPS redirect listening')
    })
  }

  return app
}

export async function stopServer(app: App): Promise<void> {
  stopFrequencyCache()
  await workspace.stopWatching()
  await app.close()
}
