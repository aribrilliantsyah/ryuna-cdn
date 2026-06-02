import type { FastifyInstance } from 'fastify'
import { fetch } from 'undici'
import { config } from '../config/index.js'
import { createLogger } from '../logger.js'
const logger = createLogger('StatusRoute')

interface StatusRoute {
  route: string
  expectedResponseTime: number
}

export function statusRoutes(app: FastifyInstance): void {
  app.post('/api/status', async (req, reply) => {
    if (!config.get<boolean>('status.enabled')) return reply.callNotFound()

    const baseUrl = config.get<string>('publicUrl.host')
      ? `${config.get<string>('publicUrl.protocol')}://${config.get<string>('publicUrl.host')}:${config.get<number>('publicUrl.port')}`
      : `http://${config.get<string>('server.host')}:${config.get<number>('server.port')}`

    const routes = config.get<StatusRoute[]>('status.routes') ?? []
    const results = []
    for (const r of routes) {
      const target = baseUrl + r.route
      const start = performance.now()
      let healthStatus: 'Green' | 'Amber' | 'Red' = 'Red'
      let httpStatus = 0
      try {
        const res = await fetch(target, {
          headers: req.headers.authorization
            ? { authorization: req.headers.authorization as string }
            : {}
        })
        const elapsed = (performance.now() - start) / 1000
        httpStatus = res.status
        if (res.ok && elapsed <= r.expectedResponseTime) healthStatus = 'Green'
        else if (res.ok) healthStatus = 'Amber'
      } catch (err) {
        logger.warn({ err, route: r.route }, 'status probe failed')
      }
      results.push({ route: r.route, httpStatus, healthStatus })
    }

    const messages = {
      Green: 'Service is responding within specified parameters',
      Amber: 'Service is responding, but outside of specified parameters',
      Red: 'Service is not responding correctly'
    }
    const primary = results[0]?.healthStatus ?? 'Red'

    return reply.code(200).send({
      site: 'ryunacdn',
      package: '@aribrilliantsyah/ryunacdn',
      version: '1.0.0',
      routes: results,
      status: {
        status: results[0]?.httpStatus ?? 0,
        healthStatus: primary,
        message: messages[primary]
      }
    })
  })
}
