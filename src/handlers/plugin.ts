import type { FastifyRequest } from 'fastify'
import { Readable } from 'node:stream'
import { cache } from '../cache/index.js'
import { createStorage } from '../storage/factory.js'
import type { Handler, StorageAdapter } from '../types.js'
import { streamToBuffer } from '../utils/stream.js'

export interface PluginContext {
  assetStore: typeof createStorage
  cache: {
    get: (key: string) => Promise<Buffer | null>
    set: (key: string, value: Buffer | string) => Promise<void>
  }
  req: FastifyRequest
  setHeader: (name: string, value: string) => void
}

export type PluginFn = (ctx: PluginContext) => Promise<Buffer | Readable> | Buffer | Readable

export class PluginHandler implements Handler {
  private headers: Record<string, string> = {}
  private plugin: PluginFn
  storageHandler: StorageAdapter | null = null
  private req: FastifyRequest
  isCached = false

  constructor(req: FastifyRequest, plugin: PluginFn) {
    this.req = req
    this.plugin = plugin
  }

  async get(): Promise<Buffer> {
    try {
      const result = await this.plugin({
        assetStore: createStorage,
        cache: {
          get: (key) => cache().get(key),
          set: (key, value) => cache().set(key, value)
        },
        req: this.req,
        setHeader: (name, value) => {
          this.headers[name.toLowerCase()] = value
        }
      })
      if (Buffer.isBuffer(result)) return result
      return streamToBuffer(result as Readable)
    } catch (err) {
      const e = err as Error
      throw Object.assign(new Error('A plugin has thrown a fatal error.'), {
        statusCode: 500,
        cause: e
      })
    }
  }

  getContentType(): string {
    return this.headers['content-type'] ?? 'application/octet-stream'
  }

  getHeader(name: string): string | undefined {
    return this.headers[name.toLowerCase()]
  }
}
