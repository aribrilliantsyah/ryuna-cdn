import { transform } from 'lightningcss'
import type { FastifyRequest } from 'fastify'
import { cache } from '../cache/index.js'
import { config } from '../config/index.js'
import { createStorage } from '../storage/factory.js'
import { BaseHandler, type HandlerInit } from './base.js'

export class CSSHandler extends BaseHandler {
  private cacheKey: Array<string | number | null | undefined>
  private isExternalUrl: boolean
  private isCompressed: boolean

  constructor(_format: string, req: FastifyRequest, init: HandlerInit = {}) {
    super(req, init)
    const pathname = this.baseUrl.pathname
    this.isExternalUrl = pathname.indexOf('http://') > 0 || pathname.indexOf('https://') > 0
    this.isCompressed = Boolean(
      this.options.compress || this.baseUrl.searchParams.get('compress') === '1'
    )
    this.cacheKey = [
      req.ctx?.domain,
      this.baseUrl.toString(),
      JSON.stringify({ compress: this.isCompressed })
    ]
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

    const sourceBuf = await this.storageHandler.get()
    const output = this.isCompressed
      ? Buffer.from(
          transform({
            code: sourceBuf,
            filename: this.getFilename(),
            minify: true
          }).code
        )
      : sourceBuf

    await cache().set(this.cacheKey, output, { ttl })
    return output
  }

  getContentType(): string {
    return 'text/css'
  }

  getFilename(): string {
    return this.baseUrl.pathname.split('/').slice(-1)[0] ?? ''
  }
}
