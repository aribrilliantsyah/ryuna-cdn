import { config } from '../config/index.js'
import type { StorageAdapter } from '../types.js'
import { DiskStorage } from './disk.js'
import { HTTPStorage } from './http.js'
import { S3Storage } from './s3.js'

type AdapterName = 'disk' | 'http' | 's3'
type AssetKind = 'image' | 'asset'

const ADAPTERS: Record<AdapterName, { configBlock: 'directory' | 'remote' | 's3' }> = {
  disk: { configBlock: 'directory' },
  http: { configBlock: 'remote' },
  s3: { configBlock: 's3' }
}

function extractAdapterFromPath(assetPath: string): {
  adapter?: AdapterName
  canonicalPath: string
} {
  const clean = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath
  for (const name of Object.keys(ADAPTERS) as AdapterName[]) {
    if (clean.startsWith(`${name}/`)) {
      return { adapter: name, canonicalPath: clean.slice(name.length + 1) }
    }
  }
  return { canonicalPath: clean }
}

export function createStorage(
  kind: AssetKind,
  assetPath: string,
  opts: { domain?: string } = {}
): StorageAdapter {
  const assetType: 'images' | 'assets' = kind === 'image' ? 'images' : 'assets'
  let path = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath
  const fromPath = extractAdapterFromPath(path)
  let adapter: AdapterName

  if (fromPath.adapter) {
    adapter = fromPath.adapter
    path = fromPath.canonicalPath
  } else if (path.startsWith('http:') || path.startsWith('https:')) {
    adapter = 'http'
  } else {
    const enabled = (['directory', 'remote', 's3'] as const).find((block) =>
      config.get<boolean>(`${assetType}.${block}.enabled`, opts.domain)
    )
    adapter =
      (Object.keys(ADAPTERS) as AdapterName[]).find(
        (a) => ADAPTERS[a].configBlock === enabled
      ) ?? 'disk'
  }

  switch (adapter) {
    case 'disk':
      return new DiskStorage({ assetType, domain: opts.domain, url: path })
    case 's3':
      return new S3Storage({ assetType, domain: opts.domain, url: path })
    case 'http':
      return new HTTPStorage({ assetType, domain: opts.domain, url: path })
  }
}
