import type { FastifyInstance } from 'fastify'
import { createLogger } from '../logger.js'
const logger = createLogger('RecipeRoute')
import type { RecipeFile } from '../types.js'
import { Recipe } from '../workspace/recipe.js'
import { workspace } from '../workspace/index.js'

export function recipeRoutes(app: FastifyInstance): void {
  app.post('/api/recipes', async (req, reply) => {
    const body = req.body as RecipeFile | undefined
    if (!body || Object.keys(body).length === 0) {
      return reply.code(400).send({ success: false, errors: ['Bad Request'] })
    }
    const recipe = new Recipe(body)
    const errors = recipe.validate()
    if (errors) return reply.code(400).send({ success: false, errors })

    if (workspace.get(recipe.name, req.ctx?.domain)) {
      return reply.code(400).send({
        success: false,
        errors: [`Recipe ${recipe.name} already exists`]
      })
    }

    try {
      await recipe.save(req.ctx?.domain)
      return reply.code(201).send({ success: true, message: `Recipe "${recipe.name}" created` })
    } catch (err) {
      logger.error({ err, module: 'recipes' }, 'save failed')
      return reply.code(400).send({ success: false, errors: ['Error when saving recipe'] })
    }
  })
}
