import {
  CloudFrontClient,
  CreateInvalidationCommand
} from '@aws-sdk/client-cloudfront'
import type { FastifyInstance } from 'fastify'
import { cache } from '../cache/index.js'
import { config } from '../config/index.js'
import { createLogger } from '../logger.js'
const logger = createLogger('FlushRoute')

interface FlushBody {
  pattern?: string
}

export function flushRoutes(app: FastifyInstance): void {
  app.post('/api/flush', async (req, reply) => {
    const body = (req.body ?? {}) as FlushBody
    if (!body.pattern) {
      return reply.code(400).send({ success: false, message: "A 'pattern' must be specified" })
    }

    const domain = req.ctx?.domain
    let pattern: Array<string | null | undefined> = [domain]
    if (body.pattern !== '*') {
      try {
        const u = new URL(body.pattern, 'http://x')
        pattern = pattern.concat(u.pathname, u.search ? u.search.slice(1) : null)
      } catch {
        pattern = pattern.concat(body.pattern)
      }
    }

    try {
      await cache().delete(pattern as Array<string | number | null | undefined>)
    } catch (err) {
      logger.error({ err, module: 'flush' }, 'cache flush failed')
    }

    if (!config.get<boolean>('cloudfront.enabled')) {
      return reply.code(200).send({
        success: true,
        message: `Cache flushed for pattern "${body.pattern}"`
      })
    }

    try {
      const client = new CloudFrontClient({
        region: config.get<string>('cloudfront.region') || 'us-east-1',
        credentials: {
          accessKeyId: config.get<string>('cloudfront.accessKey'),
          secretAccessKey: config.get<string>('cloudfront.secretKey')
        }
      })
      await client.send(
        new CreateInvalidationCommand({
          DistributionId: config.get<string>('cloudfront.distribution'),
          InvalidationBatch: {
            CallerReference: new Date().toISOString(),
            Paths: { Quantity: 1, Items: [`/${body.pattern.replace(/^\/+/, '')}`] }
          }
        })
      )
      return reply.code(200).send({
        success: true,
        message: `Cache and cloudfront flushed for pattern ${body.pattern}`
      })
    } catch (err) {
      logger.error({ err, module: 'flush' }, 'cloudfront invalidation failed')
      return reply.code(200).send({
        success: true,
        message: `Cache flushed for pattern "${body.pattern}" (CloudFront failed)`
      })
    }
  })
}
