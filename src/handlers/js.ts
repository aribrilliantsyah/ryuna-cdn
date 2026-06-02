import type { FastifyRequest } from 'fastify'
import { minify } from 'terser'
import { cache } from '../cache/index.js'
import { config } from '../config/index.js'
import { createStorage } from '../storage/factory.js'
import { BaseHandler, type HandlerInit } from './base.js'

export class JSHandler extends BaseHandler {
  private cacheKey: Array<string | number | null | undefined>
  private isExternalUrl: boolean
  private wantCompress: boolean

  constructor(_format: string, req: FastifyRequest, init: HandlerInit = {}) {
    super(req, init)
    const pathname = this.baseUrl.pathname
    this.isExternalUrl = pathname.indexOf('http://') > 0 || pathname.indexOf('https://') > 0

    const merged: Record<string, unknown> = {
      ...Object.fromEntries(this.baseUrl.searchParams.entries()),
      ...this.options
    }
    this.options = Object.fromEntries(
      Object.entries(merged).map(([k, v]) => {
        if (v === 0 || v === '0' || v === 'false') return [k, false]
        if (v === 1 || v === '1' || v === 'true') return [k, true]
        return [k, v]
      })
    )

    this.wantCompress = this.options.compress === true || this.options.transform === true
    this.cacheKey = [req.ctx?.domain, this.baseUrl.toString(), this.wantCompress ? 'min' : 'raw']
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

    const raw = await this.storageHandler.get()
    const source = raw.toString('utf8')

    let output = source
    if (this.wantCompress) {
      try {
        const res = await minify(source, { ecma: 2020, compress: true, mangle: true })
        if (res.code) output = res.code
      } catch {
        // fall back to original source on minify failure
      }
    }

    const buf = Buffer.from(output)
    await cache().set(this.cacheKey, buf, { ttl })
    return buf
  }

  getContentType(): string {
    return 'application/javascript'
  }

  getFilename(): string {
    return this.baseUrl.pathname.split('/').slice(-1)[0] ?? ''
  }
}
