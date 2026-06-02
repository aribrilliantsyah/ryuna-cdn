import fs from 'node:fs'
import path from 'node:path'
import { config } from './config/index.js'

export interface DomainEntry {
  domain: string
  path?: string
}

class DomainManager {
  private domains: DomainEntry[] = []

  addDomain(domain: string, domainConfig: unknown): void {
    if (!this.getDomain(domain)) {
      config.loadDomainConfig(domain, domainConfig)
      this.domains.push({ domain })
    } else {
      config.loadDomainConfig(domain, domainConfig)
    }
  }

  removeDomain(domain: string): void {
    if (this.getDomain(domain)) {
      config.removeDomainConfig(domain)
      this.domains = this.domains.filter((d) => d.domain !== domain)
    }
  }

  getDomain(domain: string): DomainEntry | undefined {
    return this.domains.find((d) => d.domain === domain)
  }

  getDomains(): DomainEntry[] {
    return this.domains
  }

  scanDomains(directory: string): this {
    const domainsPath = path.resolve(directory)
    try {
      const entries = fs.readdirSync(domainsPath)
      this.domains = entries.reduce<DomainEntry[]>((acc, name) => {
        const domainPath = path.join(domainsPath, name)
        if (fs.statSync(domainPath).isDirectory()) acc.push({ domain: name, path: domainPath })
        return acc
      }, [])
    } catch (err) {
      const e = err as NodeJS.ErrnoException
      if (e.code === 'ENOENT') return this
      throw err
    }
    return this
  }
}

export const domainManager = new DomainManager()
