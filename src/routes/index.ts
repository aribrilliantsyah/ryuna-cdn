import type { FastifyInstance } from 'fastify'
import { collectionRoutes } from './collections.js'
import { deleteRoutes } from './delete.js'
import { domainRoutes } from './domains.js'
import { flushRoutes } from './flush.js'
import { homeRoutes } from './home.js'
import { pdfRoutes } from './pdf.js'
import { recipeRoutes } from './recipes.js'
import { routeRoutes } from './routes.js'
import { statusRoutes } from './status.js'
import { transformRoutes } from './transform.js'
import { uploadRoutes } from './upload.js'

export function registerRoutes(app: FastifyInstance): void {
  homeRoutes(app)
  collectionRoutes(app)
  uploadRoutes(app)
  deleteRoutes(app)
  pdfRoutes(app)
  flushRoutes(app)
  recipeRoutes(app)
  routeRoutes(app)
  statusRoutes(app)
  domainRoutes(app)
  transformRoutes(app)
}
