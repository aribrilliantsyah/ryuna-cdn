import languageParser from 'accept-language-parser'
import type { CountryResponse } from 'maxmind'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fetch } from 'undici'
import { UAParser } from 'ua-parser-js'
import { cache } from '../cache/index.js'
import { config } from '../config/index.js'
import { domainManager } from '../domain-manager.js'
import { createLogger } from '../logger.js'
const logger = createLogger('Route')
import type { RouteBranch, RouteBranchCondition, RouteFile } from '../types.js'

function getPathInObject(target: string, obj: unknown): unknown {
  return target.split('.').reduce<unknown>((acc, key) => {
    if (acc != null && typeof acc === 'object') return (acc as Record<string, unknown>)[key]
    return undefined
  }, obj)
}

function arrayIntersect(value: unknown, against: string[]): boolean {
  if (value == null) return false
  const items = Array.isArray(value) ? value : [value]
  return against.some((el) =>
    items.some((item) => String(item).toLowerCase() === String(el).toLowerCase())
  )
}

export class Route {
  config: RouteFile
  domain?: string
  ip?: string
  language?: string
  userAgent?: string

  constructor(content: RouteFile) {
    this.config = content
  }

  setDomain(domain?: string): void {
    this.domain = domain
  }

  setIP(ip?: string): void {
    this.ip = ip
  }

  setLanguage(language?: string): void {
    this.language = language
  }

  setUserAgent(ua?: string): void {
    this.userAgent = ua
  }

  validate(): string[] | null {
    const errors: string[] = []
    if (!this.config.route) errors.push('Route name is missing')
    if (!/^[A-Za-z-_]{5,}$/.test(this.config.route ?? '')) {
      errors.push(
        'Route name must be 5 characters or longer and contain only letters, dashes and underscores'
      )
    }
    if (Array.isArray(this.config.branches)) {
      this.config.branches.forEach((b, i) => {
        if (!b.recipe) errors.push(`Branch ${i} does not have a recipe`)
      })
    } else {
      errors.push('Route branches missing or invalid')
    }
    return errors.length ? errors : null
  }

  private cacheKey(): string[] {
    return [this.domain ?? '', `${this.ip ?? ''}${this.config.route}`]
  }

  private getDevice(): string {
    return new UAParser(this.userAgent ?? '').getDevice().type ?? 'desktop'
  }

  private getLanguages(minQuality: number): string[] {
    return languageParser
      .parse(this.language ?? '')
      .filter((l) => l.quality >= minQuality)
      .map((l) => l.code)
  }

  private async getLocation(): Promise<string | null | undefined> {
    if (!config.get<boolean>('geolocation.enabled')) return null
    const method = config.get<'maxmind' | 'remote'>('geolocation.method')
    if (method === 'maxmind') return this.getMaxmindLocation()
    if (method === 'remote') return this.getRemoteLocation()
    return null
  }

  private async getMaxmindLocation(): Promise<string | null> {
    const dbPath = path.resolve(config.get<string>('geolocation.maxmind.countryDbPath'))
    try {
      const { open } = await import('maxmind')
      const reader = await open<CountryResponse>(dbPath)
      const country = reader.get(this.ip ?? '')
      return country?.country?.iso_code ?? null
    } catch (err) {
      logger.error({ module: 'routes', err }, 'maxmind failed')
      return null
    }
  }

  private async getRemoteLocation(): Promise<string | null> {
    const url = (config.get<string>('geolocation.remote.url') ?? '')
      .replace('{ip}', this.ip ?? '')
      .replace('{key}', config.get<string>('geolocation.remote.key') ?? '')
      .replace('{secret}', config.get<string>('geolocation.remote.secret') ?? '')
    const countryPath = config.get<string>('geolocation.remote.countryPath')
    try {
      const res = await fetch(url, { headers: { accept: 'application/json' } })
      const json = await res.json()
      return (getPathInObject(countryPath, json) as string) ?? null
    } catch (err) {
      logger.error({ module: 'routes', err }, 'remote geo failed')
      return null
    }
  }

  private async getNetwork(): Promise<string[] | null> {
    const networkPath = config.get<string>('network.path')
    let url = config.get<string>('network.url') ?? ''
    url = url
      .replace('{ip}', this.ip ?? '')
      .replace('{key}', config.get<string>('network.key') ?? '')
      .replace('{secret}', config.get<string>('network.secret') ?? '')
    try {
      const res = await fetch(url, { headers: { accept: 'application/json' } })
      const value = getPathInObject(networkPath, await res.json())
      return typeof value === 'string' ? value.split('/') : null
    } catch (err) {
      logger.error({ module: 'routes', err }, 'network failed')
      return null
    }
  }

  private async matchBranch(branch: RouteBranch): Promise<boolean> {
    const condition = branch.condition
    if (!condition) return true
    let match = true

    for (const type of Object.keys(condition) as (keyof RouteBranchCondition)[]) {
      if (type === 'languageMinQuality') continue
      const raw = condition[type]
      if (raw == null) continue
      const arr = Array.isArray(raw) ? raw.map(String) : [String(raw)]

      switch (type) {
        case 'device':
          match = match && arrayIntersect(this.getDevice(), arr)
          break
        case 'language': {
          const minQ = Number(condition.languageMinQuality ?? 1) || 1
          const langs = this.getLanguages(minQ)
          match = match && langs.some((l) => arrayIntersect(l, arr))
          break
        }
        case 'country': {
          const loc = await this.getLocation()
          match = match && arrayIntersect(loc, arr)
          break
        }
        case 'network': {
          const network = await this.getNetwork()
          match = match && !!network && arrayIntersect(network, arr)
          break
        }
      }
      if (!match) break
    }
    return match
  }

  private async evaluateBranches(branches: RouteBranch[], index = 0): Promise<RouteBranch | null> {
    if (!branches[index]) return null
    const ok = await this.matchBranch(branches[index])
    if (ok) return branches[index]
    return this.evaluateBranches(branches, index + 1)
  }

  async getRecipe(): Promise<string | null> {
    const match = await this.evaluateBranches(this.config.branches)
    const recipe = match?.recipe ?? null
    if (recipe) {
      try {
        await cache().set(this.cacheKey(), recipe)
      } catch (err) {
        logger.error({ module: 'routes', err }, 'cache set failed')
      }
    }
    return recipe
  }

  async save(domainName?: string): Promise<void> {
    const domain = domainName ? domainManager.getDomain(domainName) : undefined
    const file = path.resolve(
      domain?.path ?? '',
      config.get<string>('paths.routes', domainName),
      `${this.config.route}.json`
    )
    await fs.mkdir(path.dirname(file), { recursive: true })
    await fs.writeFile(file, JSON.stringify(this.config, null, 2))
  }
}
