import { config } from '../config/index.js'
import { cacheKey } from '../utils/hash.js'
import { DiskCache } from './disk.js'
import { RedisCache } from './redis.js'

export interface CacheBackend {
  get(key: string): Promise<Buffer | null>
  getMetadata(key: string): Promise<Record<string, unknown> | null>
  set(
    key: string,
    value: Buffer | string,
    opts?: { ttl?: number; metadata?: Record<string, unknown> }
  ): Promise<void>
  delete(prefix: string): Promise<void>
}

class NoopCache implements CacheBackend {
  async get(): Promise<Buffer | null> {
    return null
  }
  async getMetadata(): Promise<Record<string, unknown> | null> {
    return null
  }
  async set(): Promise<void> {}
  async delete(): Promise<void> {}
}

export type CacheKeyInput = string | Array<string | number | null | undefined>

export class Cache {
  private backend: CacheBackend
  readonly enabled: boolean

  constructor() {
    const useRedis = config.get<boolean>('caching.redis.enabled')
    const useDisk = config.get<boolean>('caching.directory.enabled')
    this.enabled = useRedis || useDisk
    this.backend = useRedis ? new RedisCache() : useDisk ? new DiskCache() : new NoopCache()
  }

  private normaliseKey(key: CacheKeyInput): string {
    if (typeof key === 'string') return key
    return cacheKey(key)
  }

  async get(key: CacheKeyInput): Promise<Buffer | null> {
    if (!this.enabled) return null
    return this.backend.get(this.normaliseKey(key))
  }

  async getMetadata(key: CacheKeyInput): Promise<Record<string, unknown> | null> {
    if (!this.enabled) return null
    return this.backend.getMetadata(this.normaliseKey(key))
  }

  async set(
    key: CacheKeyInput,
    value: Buffer | string,
    opts: { ttl?: number; metadata?: Record<string, unknown> } = {}
  ): Promise<void> {
    if (!this.enabled) return
    await this.backend.set(this.normaliseKey(key), value, opts)
  }

  async delete(prefix: CacheKeyInput = ''): Promise<void> {
    if (!this.enabled) return
    await this.backend.delete(this.normaliseKey(prefix))
  }
}

let instance: Cache | null = null
export function cache(): Cache {
  if (!instance) instance = new Cache()
  return instance
}

export function resetCache(): void {
  instance = null
}
