import type { FastifyInstance } from 'fastify'
import { createLogger } from '../logger.js'
const logger = createLogger('RouteRoute')
import type { RouteFile } from '../types.js'
import { Route } from '../workspace/route.js'
import { workspace } from '../workspace/index.js'

export function routeRoutes(app: FastifyInstance): void {
  app.post('/api/routes', async (req, reply) => {
    const body = req.body as RouteFile | undefined
    if (!body || Object.keys(body).length === 0) {
      return reply.code(400).send({ success: false, errors: ['Bad Request'] })
    }
    const route = new Route(body)
    const errors = route.validate()
    if (errors) return reply.code(400).send({ success: false, errors })

    if (workspace.get(route.config.route, req.ctx?.domain)) {
      return reply.code(400).send({
        success: false,
        errors: [`Route '${route.config.route}' already exists`]
      })
    }

    try {
      await route.save(req.ctx?.domain)
      return reply.code(200).send({ success: true })
    } catch (err) {
      logger.error({ err, module: 'routes' }, 'save failed')
      return reply.code(400).send({ success: false, errors: ['Error when saving route'] })
    }
  })
}
