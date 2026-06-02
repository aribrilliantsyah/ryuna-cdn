import fs from 'node:fs/promises'
import path from 'node:path'
import { config } from '../config/index.js'
import { domainManager } from '../domain-manager.js'
import type { RecipeFile } from '../types.js'

export class Recipe {
  recipe: RecipeFile
  name: string

  constructor(content: RecipeFile) {
    this.recipe = content
    this.name = content.recipe
  }

  validate(): string[] | null {
    const errors: string[] = []
    if (this.recipe.recipe === undefined) errors.push('Property "recipe" not found in recipe')
    if (this.recipe.settings === undefined) errors.push('Property "settings" not found in recipe')
    if (!/^[A-Za-z-_]{5,}$/.test(this.recipe.recipe ?? '')) {
      errors.push(
        'Recipe name must be 5 characters or longer and contain only letters, dashes and underscores'
      )
    }
    return errors.length ? errors : null
  }

  async save(domainName?: string): Promise<void> {
    const domain = domainName ? domainManager.getDomain(domainName) : undefined
    const recipePath = path.resolve(
      domain?.path ?? '',
      config.get<string>('paths.recipes', domainName),
      `${this.name}.json`
    )
    await fs.mkdir(path.dirname(recipePath), { recursive: true })
    await fs.writeFile(recipePath, JSON.stringify(this.recipe, null, 2))
  }
}
