import fs from 'node:fs'
import path from 'node:path'
import { type AppConfig, canOverrideAtDomain, configSchema } from './schema.js'

type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T

function getByPath<T = unknown>(obj: unknown, path: string): T | undefined {
  return path
    .split('.')
    .reduce<unknown>((acc, key) => (acc != null ? (acc as Record<string, unknown>)[key] : acc), obj) as
    | T
    | undefined
}

function envOverlay(): DeepPartial<AppConfig> {
  const env = process.env
  const o: DeepPartial<AppConfig> = {}
  if (env.PORT) o.server = { ...o.server, port: Number(env.PORT) }
  if (env.HOST) o.server = { ...o.server, host: env.HOST }
  if (env.PROTOCOL) o.server = { ...o.server, protocol: env.PROTOCOL as 'http' | 'https' }
  if (env.NODE_ENV) o.env = env.NODE_ENV as AppConfig['env']
  if (env.CACHE_ENABLE_DIRECTORY)
    o.caching = { ...o.caching, directory: { enabled: env.CACHE_ENABLE_DIRECTORY === 'true', path: undefined as never } }
  if (env.CACHE_ENABLE_REDIS)
    o.caching = { ...o.caching, redis: { ...(o.caching?.redis ?? {}), enabled: env.CACHE_ENABLE_REDIS === 'true' } }
  if (env.REDIS_HOST) o.caching = { ...o.caching, redis: { ...(o.caching?.redis ?? {}), host: env.REDIS_HOST } }
  if (env.REDIS_PORT)
    o.caching = { ...o.caching, redis: { ...(o.caching?.redis ?? {}), port: Number(env.REDIS_PORT) } }
  if (env.REDIS_PASSWORD)
    o.caching = { ...o.caching, redis: { ...(o.caching?.redis ?? {}), password: env.REDIS_PASSWORD } }
  if (env.AUTH_CLIENT_ID) o.auth = { ...o.auth, clientId: env.AUTH_CLIENT_ID }
  if (env.AUTH_SECRET) o.auth = { ...o.auth, secret: env.AUTH_SECRET }
  if (env.AUTH_KEY) o.auth = { ...o.auth, privateKey: env.AUTH_KEY }
  return o
}

function readJsonIfExists(file: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'))
  } catch {
    return {}
  }
}

function mergeDeep<T>(base: T, ...overlays: unknown[]): T {
  const out: Record<string, unknown> = JSON.parse(JSON.stringify(base))
  for (const overlay of overlays) {
    if (!overlay || typeof overlay !== 'object') continue
    for (const [k, v] of Object.entries(overlay as Record<string, unknown>)) {
      if (v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object') {
        out[k] = mergeDeep(out[k], v)
      } else if (v !== undefined) {
        out[k] = v
      }
    }
  }
  return out as T
}

export class Config {
  private base: AppConfig
  private domainConfigs = new Map<string, AppConfig>()
  private envName: string

  constructor() {
    this.envName = process.env.NODE_ENV ?? 'development'
    const envFile = path.resolve(`./config/config.${this.envName}.json`)
    const fileData = fs.existsSync(envFile) ? readJsonIfExists(envFile) : {}
    const merged = mergeDeep({}, fileData, envOverlay())
    this.base = configSchema.parse(merged)
  }

  get<T = unknown>(key: string, domain?: string): T {
    if (domain && this.domainConfigs.has(domain) && canOverrideAtDomain(key)) {
      const v = getByPath<T>(this.domainConfigs.get(domain), key)
      if (v !== undefined) return v
    }
    return getByPath<T>(this.base, key) as T
  }

  set<T = unknown>(key: string, value: T, domain?: string): void {
    const target =
      domain && this.domainConfigs.has(domain) && canOverrideAtDomain(key)
        ? (this.domainConfigs.get(domain) as Record<string, unknown>)
        : (this.base as Record<string, unknown>)

    const parts = key.split('.')
    let cursor: Record<string, unknown> = target
    for (let i = 0; i < parts.length - 1; i++) {
      const p = parts[i]!
      if (typeof cursor[p] !== 'object' || cursor[p] === null) cursor[p] = {}
      cursor = cursor[p] as Record<string, unknown>
    }
    cursor[parts[parts.length - 1]!] = value
  }

  loadDomainConfig(domain: string, raw: unknown): void {
    const merged = mergeDeep(this.base, raw)
    this.domainConfigs.set(domain, configSchema.parse(merged))
  }

  removeDomainConfig(domain: string): void {
    this.domainConfigs.delete(domain)
  }

  hasDomain(domain: string): boolean {
    return this.domainConfigs.has(domain)
  }

  get raw(): AppConfig {
    return this.base
  }
}

export const config = new Config()
export type { AppConfig }
