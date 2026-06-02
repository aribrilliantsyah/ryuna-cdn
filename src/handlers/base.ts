import type { FastifyRequest } from 'fastify'
import type { StorageAdapter } from '../types.js'

export interface HandlerInit {
  options?: Record<string, unknown>
  plugins?: string[]
}

export abstract class BaseHandler {
  req: FastifyRequest
  options: Record<string, unknown>
  storageHandler: StorageAdapter | null = null
  isCached = false
  protected baseUrl: URL

  constructor(req: FastifyRequest, init: HandlerInit = {}) {
    this.req = req
    this.options = { ...init.options }
    this.baseUrl = new URL(req.url, 'http://x')
  }

  setBaseUrl(url: string): void {
    this.baseUrl = new URL(url, 'http://x')
  }

  getLastModified(): Date | undefined {
    return this.storageHandler?.getLastModified()
  }

  abstract get(): Promise<Buffer>
  abstract getContentType(): string
  abstract getFilename(): string
}
