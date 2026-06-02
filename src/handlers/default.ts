import path from 'node:path'
import mime from 'mime'
import { cache } from '../cache/index.js'
import { config } from '../config/index.js'
import { createStorage } from '../storage/factory.js'
import { BaseHandler, type HandlerInit } from './base.js'
import type { FastifyRequest } from 'fastify'

export class DefaultHandler extends BaseHandler {
  private cacheKey: Array<string | number | null | undefined>
  private isExternalUrl: boolean

  constructor(_format: string, req: FastifyRequest, init: HandlerInit = {}) {
    super(req, init)
    const pathname = this.baseUrl.pathname
    this.isExternalUrl = pathname.indexOf('http://') > 0 || pathname.indexOf('https://') > 0
    this.cacheKey = [req.ctx?.domain, this.baseUrl.toString()]
  }

  async get(): Promise<Buffer> {
    const domain = this.req.ctx?.domain
    const ttl = config.get<number>('caching.ttl', domain)

    const cached = await cache().get(this.cacheKey)
    if (cached) {
      this.isCached = true
      return cached
    }

    this.storageHandler = createStorage('asset', this.baseUrl.pathname.slice(1), { domain })

    if (
      this.isExternalUrl &&
      (!config.get<boolean>('assets.remote.enabled', domain) ||
        !config.get<boolean>('assets.remote.allowFullURL', domain))
    ) {
      throw Object.assign(new Error('Loading assets from a full remote URL is not supported'), {
        statusCode: 403
      })
    }

    const data = await this.storageHandler.get()
    await cache().set(this.cacheKey, data, { ttl })
    return data
  }

  getContentType(): string {
    let url = this.baseUrl.pathname
    if (this.storageHandler && this.storageHandler.url !== url) url = this.storageHandler.url
    if (path.extname(url) === '') return 'text/html'
    return mime.getType(url) ?? 'application/octet-stream'
  }

  getFilename(): string {
    return this.baseUrl.pathname.split('/').slice(-1)[0] ?? ''
  }
}
