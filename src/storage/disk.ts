import fs from 'node:fs'
import path from 'node:path'
import { config } from '../config/index.js'
import type { StorageAdapter } from '../types.js'
import { Missing } from './missing.js'

export class DiskStorage implements StorageAdapter {
  url: string
  domain?: string
  path: string
  lastModified?: Date
  notFound = false
  providerType = 'Disk'

  constructor({
    assetType,
    domain,
    url
  }: { assetType: 'images' | 'assets'; domain?: string; url: string }) {
    const assetPath = config.get<string>(`${assetType}.directory.path`, domain) ?? './storage'
    this.url = url !== '' ? new URL(`http://x/${url.replace(/^\/+/, '')}`).pathname : '/'
    this.domain = domain
    this.path = path.resolve(assetPath)
  }

  getFullUrl(): string {
    return decodeURIComponent(path.join(this.path, this.url))
  }

  getLastModified(): Date | undefined {
    return this.lastModified
  }

  private async getDefaultFile(): Promise<string | undefined> {
    const fullUrl = this.getFullUrl()
    try {
      const stats = await fs.promises.lstat(fullUrl)
      if (!stats.isDirectory()) return undefined
      const defaults = config.get<string[]>('defaultFiles') ?? []
      const files = await fs.promises.readdir(fullUrl)
      const match = files.find((f) => defaults.includes(path.basename(f)))
      return match ?? 'no-default-configured'
    } catch {
      return undefined
    }
  }

  async get(): Promise<Buffer> {
    const isDirectory = path.parse(this.getFullUrl()).ext === ''

    if (isDirectory) {
      const def = await this.getDefaultFile()
      if (def) this.url = `/${def}`
    }

    try {
      const full = this.getFullUrl()
      const stats = await fs.promises.stat(full)
      if (stats.size === 0) {
        throw Object.assign(new Error('File size is 0 bytes'), { statusCode: 404 })
      }
      this.lastModified = stats.mtime
      return fs.promises.readFile(full)
    } catch (err) {
      const e = err as NodeJS.ErrnoException & { statusCode?: number }
      if (e.statusCode === 404 || e.code === 'ENOENT' || e.code === 'EISDIR') {
        try {
          const buf = await new Missing().get({ domain: this.domain, isDirectory })
          this.notFound = true
          this.lastModified = new Date()
          return buf
        } catch {
          throw Object.assign(new Error(`File not found: ${this.getFullUrl()}`), {
            statusCode: 404
          })
        }
      }
      throw err
    }
  }
}
