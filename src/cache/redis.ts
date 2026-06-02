import { Redis } from 'ioredis'
import { config } from '../config/index.js'

export class RedisCache {
  private client: Redis
  private metaSuffix = ':meta'

  constructor() {
    this.client = new Redis({
      host: config.get<string>('caching.redis.host'),
      port: config.get<number>('caching.redis.port'),
      password: config.get<string>('caching.redis.password') || undefined,
      lazyConnect: false,
      maxRetriesPerRequest: 3
    })
  }

  async get(key: string): Promise<Buffer | null> {
    const v = await this.client.getBuffer(key)
    return v ?? null
  }

  async getMetadata(key: string): Promise<Record<string, unknown> | null> {
    const raw = await this.client.get(key + this.metaSuffix)
    return raw ? (JSON.parse(raw) as Record<string, unknown>) : null
  }

  async set(
    key: string,
    value: Buffer | string,
    opts: { ttl?: number; metadata?: Record<string, unknown> } = {}
  ): Promise<void> {
    const data = typeof value === 'string' ? Buffer.from(value) : value
    if (opts.ttl) {
      await this.client.set(key, data, 'EX', opts.ttl)
      if (opts.metadata) await this.client.set(key + this.metaSuffix, JSON.stringify(opts.metadata), 'EX', opts.ttl)
    } else {
      await this.client.set(key, data)
      if (opts.metadata) await this.client.set(key + this.metaSuffix, JSON.stringify(opts.metadata))
    }
  }

  async delete(prefix: string): Promise<void> {
    const stream = this.client.scanStream({ match: prefix ? `${prefix}*` : '*' })
    const keys: string[] = []
    for await (const batch of stream) keys.push(...(batch as string[]))
    if (keys.length) await this.client.del(...keys)
  }

  async quit(): Promise<void> {
    await this.client.quit()
  }
}
