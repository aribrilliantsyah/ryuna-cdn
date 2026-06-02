import type { FastifyReply } from 'fastify'
import mime from 'mime'
import { config } from '../config/index.js'
import type { Handler } from '../types.js'

interface CacheControlConfig {
  default: string
  paths: Array<Record<string, string>>
  mimetypes: Array<Record<string, string>>
}

export function applyCacheControl(reply: FastifyReply, handler: Handler, domain?: string): void {
  const cfg = config.get<CacheControlConfig>('headers.cacheControl', domain)
  if (!cfg) return

  const set = (value: string): void => {
    if (!value || reply.getHeader('cache-control')) return
    reply.header('Cache-Control', value)
  }

  for (const entry of cfg.paths ?? []) {
    const [key, value] = Object.entries(entry)[0] ?? []
    if (!key || !value) continue
    if (handler.storageHandler?.getFullUrl().includes(key)) set(value)
  }
  for (const entry of cfg.mimetypes ?? []) {
    const [key, value] = Object.entries(entry)[0] ?? []
    if (!key || !value) continue
    if (handler.getFilename && mime.getType(handler.getFilename()) === key) set(value)
  }
  set(cfg.default ?? '')
}
