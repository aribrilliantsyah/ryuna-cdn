import cacache from 'cacache'
import path from 'node:path'
import { config } from '../config/index.js'

export interface CacheEntry {
  data: Buffer
  metadata?: Record<string, unknown>
}

export class DiskCache {
  private dir: string

  constructor() {
    this.dir = path.resolve(config.get<string>('caching.directory.path') ?? './cache')
  }

  async get(key: string): Promise<Buffer | null> {
    try {
      const obj = await cacache.get(this.dir, key)
      return obj.data as Buffer
    } catch {
      return null
    }
  }

  async getMetadata(key: string): Promise<Record<string, unknown> | null> {
    try {
      const info = await cacache.get.info(this.dir, key)
      return (info?.metadata as Record<string, unknown>) ?? null
    } catch {
      return null
    }
  }

  async set(
    key: string,
    value: Buffer | string,
    opts: { ttl?: number; metadata?: Record<string, unknown> } = {}
  ): Promise<void> {
    const data = typeof value === 'string' ? Buffer.from(value) : value
    await cacache.put(this.dir, key, data, {
      metadata: { ...opts.metadata, expiresAt: opts.ttl ? Date.now() + opts.ttl * 1000 : undefined }
    })
  }

  async getWithTtl(key: string, ttl?: number): Promise<Buffer | null> {
    const info = await this.getMetadata(key)
    if (info?.expiresAt && typeof info.expiresAt === 'number' && info.expiresAt < Date.now()) {
      await this.delete(key)
      return null
    }
    if (ttl !== undefined && !info) return null
    return this.get(key)
  }

  async delete(prefix: string): Promise<void> {
    if (!prefix) {
      await cacache.rm.all(this.dir)
      return
    }
    const list = await cacache.ls(this.dir)
    await Promise.all(
      Object.keys(list)
        .filter((k) => k.startsWith(prefix))
        .map((k) => cacache.rm.entry(this.dir, k))
    )
  }
}
