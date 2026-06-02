import etag from 'etag'
import type { FastifyInstance } from 'fastify'
import { config } from '../config/index.js'
import { handlerFactory } from '../handlers/factory.js'
import { createLogger } from '../logger.js'
const logger = createLogger('TransformRoute')
import { applyCacheControl } from '../middleware/cache-control.js'
import { sendSeekable } from '../middleware/range.js'
import { WorkQueue } from '../middleware/work-queue.js'
import { sha1 } from '../utils/hash.js'

const TRANSFORM_CONCURRENCY = Number(process.env.RYUNACDN_QUEUE_CONCURRENCY ?? 8)

const queue = new WorkQueue<{ handler: Awaited<ReturnType<typeof handlerFactory.create>>; data: Buffer }>({
  concurrency: TRANSFORM_CONCURRENCY
})

const FAVICON_REGEX =
  /\/(favicon|(apple-)?touch-icon(-i(phone|pad))?(-\d{2,}x\d{2,})?(-precomposed)?)\.(jpe?g|png|ico|gif)$/i

export function transformRoutes(app: FastifyInstance): void {
  app.get('/*', async (req, reply) => {
    if (FAVICON_REGEX.test(req.url)) {
      return reply.code(204).send()
    }

    const domain = req.ctx?.domain
    const queueKey = sha1((domain ?? '') + req.url)

    try {
      const { handler, data } = await queue.run(queueKey, async () => {
        const handler = await handlerFactory.create(req)
        const result = await handler.get()
        return { handler, data: result }
      })

      applyCacheControl(reply, handler, domain)

      if (handler.storageHandler?.notFound) {
        reply.code(config.get<number>('notFound.statusCode', domain) ?? 404)
      }

      const lm = handler.getLastModified?.()
      if (lm) reply.header('Last-Modified', lm.toUTCString?.() ?? new Date(lm).toUTCString())

      const contentType = handler.getContentType()
      reply.header('Content-Type', contentType).header('Vary', 'Accept-Encoding')

      const etagResult = etag(data)
      reply.header('ETag', etagResult)

      if (
        req.headers['if-none-match'] === etagResult &&
        contentType !== 'application/json'
      ) {
        return reply.code(304).send()
      }

      reply.header('X-Cache', handler.isCached ? 'HIT' : 'MISS')

      if (req.headers.range) {
        sendSeekable(req, reply, data, contentType)
        return reply
      }
      return reply.send(data)
    } catch (err) {
      const e = err as { statusCode?: number; message?: string; detail?: string; __handler?: { isCached?: boolean } }
      logger.error({ err: e, url: req.url }, 'transform failed')
      if (e.__handler) reply.header('X-Cache', e.__handler.isCached ? 'HIT' : 'MISS')
      return reply.code(e.statusCode ?? 400).send({
        statusCode: e.statusCode ?? 400,
        message: e.message ?? 'unknown error',
        detail: e.detail,
        success: false
      })
    }
  })
}
