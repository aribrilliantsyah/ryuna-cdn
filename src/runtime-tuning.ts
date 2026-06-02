import { availableParallelism } from 'node:os'
import sharp from 'sharp'
import { createLogger } from './logger.js'

const log = createLogger('Runtime')

/**
 * Boot-time tuning to keep a single deploy responsive under burst load.
 * Override via env:
 *   SHARP_CONCURRENCY        threads sharp may use per worker (default = max(1, cpus/4))
 *   SHARP_CACHE_MEMORY_MB    sharp internal cache cap in MB (default 64)
 *   SHARP_CACHE_FILES        sharp cache file handle cap (default 0 = unlimited)
 *   SHARP_CACHE_ITEMS        sharp cache items cap (default 100)
 */
export function applyRuntimeTuning(): void {
  const cpuCount = availableParallelism()
  const concurrency = Number(
    process.env.SHARP_CONCURRENCY ?? Math.max(1, Math.floor(cpuCount / 4))
  )
  const cacheMemMb = Number(process.env.SHARP_CACHE_MEMORY_MB ?? 64)
  const cacheFiles = Number(process.env.SHARP_CACHE_FILES ?? 0)
  const cacheItems = Number(process.env.SHARP_CACHE_ITEMS ?? 100)

  sharp.concurrency(concurrency)
  sharp.cache({ memory: cacheMemMb, files: cacheFiles, items: cacheItems })

  log.info(
    { sharpConcurrency: concurrency, cacheMemMb, cacheFiles, cacheItems, cpuCount },
    '🔧 runtime tuning applied'
  )
}
