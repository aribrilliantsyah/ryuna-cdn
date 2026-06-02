import type { FastifyRequest } from 'fastify'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import urljoin from 'url-join'
import type { Handler, RecipeFile, RouteFile, WorkspaceEntry } from '../types.js'
import { workspace } from '../workspace/index.js'
import { Route } from '../workspace/route.js'
import { CSSHandler } from './css.js'
import { DefaultHandler } from './default.js'
import { ImageHandler } from './image.js'
import { JSHandler } from './js.js'
import { PluginHandler, type PluginFn } from './plugin.js'

interface CreateOpts {
  format?: string | null
  options?: Record<string, unknown>
  plugins?: string[]
}

function getFormat(req: FastifyRequest): string {
  return path
    .extname(new URL(req.url, 'http://x').pathname)
    .replace('.', '')
    .toLowerCase()
}

export class HandlerFactory {
  async create(req: FastifyRequest, mimetype?: string): Promise<Handler> {
    const parsed = new URL(req.url, 'http://x')
    const pathComponents = parsed.pathname.slice(1).split('/')
    const match = workspace.get(pathComponents[0], req.ctx?.domain) as WorkspaceEntry | undefined
    const format = mimetype ? mimetype.split('/').pop() ?? null : null

    switch (match?.type) {
      case 'plugins':
        return this.createFromPlugin(match.path, req)
      case 'recipes':
        return this.createFromRecipe({
          name: pathComponents[0]!,
          req,
          workspaceMatch: match,
          source: match.source as RecipeFile
        })
      case 'routes':
        return this.createFromRoute({
          name: pathComponents[0]!,
          req,
          source: match.source as RouteFile
        })
      default:
        return this.createFromFormat({ format, req })
    }
  }

  private createFromFormat({
    format,
    options,
    plugins,
    req
  }: CreateOpts & { req: FastifyRequest }): Handler {
    const fmt = format || getFormat(req)
    const init = { options, plugins }
    switch (fmt) {
      case 'js':
        return new JSHandler(fmt, req, init)
      case 'css':
        return new CSSHandler(fmt, req, init)
      case 'gif':
      case 'jpg':
      case 'jpeg':
      case 'json':
      case 'png':
      case 'webp':
      case 'avif':
        return new ImageHandler(fmt, req, init)
      case 'bin':
        return new ImageHandler('jpg', req, init)
      default:
        return new DefaultHandler(fmt, req, init)
    }
  }

  private async createFromPlugin(modulePath: string, req: FastifyRequest): Promise<Handler> {
    const mod = (await import(pathToFileURL(modulePath).href)) as { default?: PluginFn } | PluginFn
    const fn: PluginFn = typeof mod === 'function' ? mod : (mod as { default?: PluginFn }).default!
    return new PluginHandler(req, fn)
  }

  private createFromRecipe({
    name,
    req,
    source,
    route
  }: {
    name: string
    req: FastifyRequest
    workspaceMatch: WorkspaceEntry
    source: RecipeFile
    route?: string
  }): Handler {
    const parsed = new URL(req.url, 'http://x')
    const settings = source.settings ?? {}
    const handler = this.createFromFormat({
      format: (settings.format as string) ?? null,
      options: { ...settings, ...Object.fromEntries(parsed.searchParams) },
      plugins: source.plugins,
      req
    })

    const filePath = parsed.pathname
      .replace(new RegExp(`^/${name}/`), '/')
      .replace(route ? new RegExp(`^/${route}/`) : /^\/$/, '/')

    if (typeof handler.setBaseUrl === 'function') {
      let fullPath = filePath
      if (source.path) {
        fullPath = /^https?:\/\//.test(source.path)
          ? urljoin(source.path, filePath)
          : path.join(source.path, filePath)
      }
      handler.setBaseUrl(fullPath)
    }
    return handler
  }

  private async createFromRoute({
    name,
    req,
    source
  }: { name: string; req: FastifyRequest; source: RouteFile }): Promise<Handler> {
    const route = new Route(source)
    route.setDomain(req.ctx?.domain)
    route.setLanguage((req.headers['accept-language'] as string) ?? '')
    route.setUserAgent((req.headers['user-agent'] as string) ?? '')
    route.setIP(req.ip)

    const recipeName = await route.getRecipe()
    if (recipeName) {
      const match = workspace.get(recipeName, req.ctx?.domain) as WorkspaceEntry | undefined
      if (match?.type === 'recipes') {
        return this.createFromRecipe({
          name: recipeName,
          req,
          route: name,
          workspaceMatch: match,
          source: match.source as RecipeFile
        })
      }
    }
    throw Object.assign(new Error('Unknown URI'), {
      statusCode: 404,
      detail: `'${name}' is not a valid route, recipe, processor or image format`
    })
  }
}

export const handlerFactory = new HandlerFactory()
