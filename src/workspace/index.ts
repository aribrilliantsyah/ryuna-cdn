import { type FSWatcher, watch } from 'chokidar'
import fs from 'node:fs/promises'
import path from 'node:path'
import { config } from '../config/index.js'
import { domainManager } from '../domain-manager.js'
import { createLogger } from '../logger.js'

const logger = createLogger('Workspace')
import type { WorkspaceEntry, WorkspaceMap, WorkspaceType } from '../types.js'

const TYPES: Record<WorkspaceType, string> = {
  plugins: '*.js',
  recipes: '*.json',
  routes: '*.json'
}

export class Workspace {
  private workspace: WorkspaceMap = {}
  private watchers: Record<string, FSWatcher> = {}

  async build(): Promise<WorkspaceMap> {
    this.workspace = await this.read()
    return this.workspace
  }

  get(item?: string, domain?: string): WorkspaceEntry | WorkspaceMap | undefined {
    if (item === undefined) return this.workspace
    const key = domain ? `${domain}:${item}` : item
    return this.workspace[key]
  }

  async createDirectories(): Promise<void> {
    const dirs = (Object.keys(TYPES) as WorkspaceType[]).map((t) =>
      path.resolve(config.get<string>(`paths.${t}`))
    )
    for (const d of domainManager.getDomains()) {
      if (!d.path) continue
      for (const t of Object.keys(TYPES) as WorkspaceType[]) {
        dirs.push(path.join(d.path, config.get<string>(`paths.${t}`, d.domain)))
      }
    }
    await Promise.all(dirs.map((dir) => fs.mkdir(dir, { recursive: true })))
  }

  private async readType(type: WorkspaceType, domain?: string, domainPath?: string): Promise<WorkspaceEntry[]> {
    const dirPath = path.resolve(
      domainPath ?? '',
      config.get<string>(`paths.${type}`, domain)
    )
    let items: string[] = []
    try {
      items = await fs.readdir(dirPath)
    } catch {
      return []
    }

    const out: WorkspaceEntry[] = []
    for (const file of items) {
      const ext = path.extname(file)
      if (ext !== '.js' && ext !== '.json') continue
      const baseName = path.basename(file, ext)
      const fullPath = path.resolve(dirPath, file)
      let source: WorkspaceEntry['source']
      let workspaceKey = baseName

      if (ext === '.json') {
        try {
          const text = await fs.readFile(fullPath, 'utf8')
          source = JSON.parse(text)
        } catch (err) {
          logger.error({ module: 'workspace', file: fullPath, err }, 'failed to read workspace file')
          continue
        }
        if (type === 'recipes' && source && 'recipe' in source) workspaceKey = source.recipe
        if (type === 'routes' && source && 'route' in source) workspaceKey = source.route
      }

      if (domain) workspaceKey = `${domain}:${workspaceKey}`
      out.push({ domain, path: fullPath, source, type })
    }
    return out
  }

  private async read(): Promise<WorkspaceMap> {
    await this.createDirectories()

    const entries: Array<WorkspaceEntry & { key: string }> = []

    for (const type of Object.keys(TYPES) as WorkspaceType[]) {
      const items = await this.readType(type)
      for (const it of items) {
        const base = path.basename(it.path, path.extname(it.path))
        const key =
          it.type === 'recipes' && it.source && 'recipe' in it.source ? it.source.recipe : base
        entries.push({ ...it, key: key as string })
      }
    }

    if (config.get<boolean>('multiDomain.enabled')) {
      for (const d of domainManager.getDomains()) {
        for (const type of Object.keys(TYPES) as WorkspaceType[]) {
          const items = await this.readType(type, d.domain, d.path)
          for (const it of items) {
            const base = path.basename(it.path, path.extname(it.path))
            const k =
              it.type === 'recipes' && it.source && 'recipe' in it.source ? it.source.recipe : base
            entries.push({ ...it, key: `${d.domain}:${k}` })
          }
        }
      }
    }

    const map: WorkspaceMap = {}
    for (const { key, ...entry } of entries) {
      if (map[key]) {
        throw new Error(
          `Naming conflict: ${key} exists in both '${map[key].path}' and '${entry.path}'`
        )
      }
      map[key] = entry
    }
    return map
  }

  startWatching(): void {
    for (const type of Object.keys(TYPES) as WorkspaceType[]) {
      const dir = path.resolve(config.get<string>(`paths.${type}`))
      const w = watch(`${dir}/${TYPES[type]}`, { usePolling: true })
      w.on('all', () => this.build().catch((err) => logger.error({ err, type }, 'workspace rebuild failed')))
      this.watchers[type] = w
    }
    for (const d of domainManager.getDomains()) {
      for (const type of Object.keys(TYPES) as WorkspaceType[]) {
        const dir = path.resolve(d.path ?? '', config.get<string>(`paths.${type}`, d.domain))
        const w = watch(`${dir}/${TYPES[type]}`, { usePolling: true })
        w.on('all', () => this.build().catch((err) => logger.error({ err }, 'rebuild failed')))
        this.watchers[`${d.domain}:${type}`] = w
      }
    }
  }

  async stopWatching(): Promise<void> {
    await Promise.all(Object.values(this.watchers).map((w) => w.close()))
    this.watchers = {}
  }
}

export const workspace = new Workspace()
