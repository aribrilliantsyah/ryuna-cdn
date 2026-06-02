import path from 'node:path'
import { fetch } from 'undici'
import urljoin from 'url-join'
import { config } from '../config/index.js'
import type { StorageAdapter } from '../types.js'
import { Missing } from './missing.js'

export class HTTPStorage implements StorageAdapter {
  url: string
  domain?: string
  baseUrl?: string
  lastModified?: Date
  notFound = false
  providerType = 'HTTP'

  constructor({
    assetType,
    domain,
    url
  }: { assetType: 'images' | 'assets'; domain?: string; url: string }) {
    const isExternal = url.startsWith('http://') || url.startsWith('https://')
    const remote = config.get<string>(`${assetType}.remote.path`, domain)

    if (!isExternal) {
      if (!remote) throw new Error('Remote address not specified')
      this.baseUrl = remote
    }

    this.domain = domain
    this.url = url
  }

  getFullUrl(): string {
    return this.baseUrl ? urljoin(this.baseUrl, this.url) : this.url
  }

  getLastModified(): Date | undefined {
    return this.lastModified
  }

  async get(redirects = 0): Promise<Buffer> {
    const requestUrl = this.getFullUrl()
    const maxRedirects = config.get<number>('http.followRedirects', this.domain) ?? 10

    const res = await fetch(requestUrl, {
      headers: { 'User-Agent': 'RyunaCDN' },
      redirect: 'manual'
    })

    const status = res.status

    if (status === 200) {
      const lm = res.headers.get('last-modified')
      if (lm) this.lastModified = new Date(lm)
      const buf = Buffer.from(await res.arrayBuffer())
      return buf
    }

    if ([301, 302, 307, 308].includes(status)) {
      const location = res.headers.get('location')
      if (location && redirects < maxRedirects) {
        const next = new URL(location, requestUrl).toString()
        this.url = next
        this.baseUrl = undefined
        return this.get(redirects + 1)
      }
    }

    if (status === 404) {
      try {
        const buf = await new Missing().get({
          domain: this.domain,
          isDirectory: path.parse(this.getFullUrl()).ext === ''
        })
        this.notFound = true
        this.lastModified = new Date()
        return buf
      } catch {}
    }

    const err = new Error(
      status === 404
        ? `Not Found: ${requestUrl}`
        : status === 403
          ? `Forbidden: ${requestUrl}`
          : `Remote server responded with error code ${status} for URL: ${requestUrl}`
    )
    throw Object.assign(err, { statusCode: status })
  }
}
