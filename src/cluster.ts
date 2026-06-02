import cluster from 'node:cluster'
import { availableParallelism } from 'node:os'
import { createLogger } from './logger.js'
import { startServer, stopServer } from './server.js'
import type { FastifyInstance } from 'fastify'

const logger = createLogger('Cluster')

function attachWorkerShutdown(app: FastifyInstance): void {
  let shuttingDown = false
  const timeoutMs = Number(process.env.RYUNACDN_SHUTDOWN_TIMEOUT_MS ?? 4_000)

  const handle = async (signal: NodeJS.Signals | 'message'): Promise<void> => {
    if (shuttingDown) return
    shuttingDown = true
    logger.info({ pid: process.pid, signal }, '🛑 worker graceful shutdown')

    const force = setTimeout(() => process.exit(1), timeoutMs).unref()
    try {
      await stopServer(app)
      clearTimeout(force)
      process.exit(0)
    } catch {
      process.exit(1)
    }
  }

  process.on('SIGTERM', () => void handle('SIGTERM'))
  process.on('SIGINT', () => void handle('SIGINT'))
  process.on('message', (msg: { type?: string } | string) => {
    if (typeof msg === 'object' && msg?.type === 'shutdown') void handle('message')
  })
}

export async function runWithCluster(): Promise<void> {
  if (!cluster.isPrimary) {
    const app = await startServer()
    attachWorkerShutdown(app)
    logger.info({ pid: process.pid }, '🐾 worker ready')
    return
  }

  const numWorkers = availableParallelism()
  logger.info({ workers: numWorkers }, '🧬 primary forking workers')
  for (let i = 0; i < numWorkers; i++) cluster.fork()

  cluster.on('online', (worker) => logger.info({ pid: worker.process.pid }, '✨ worker online'))
  cluster.on('exit', (worker, code, signal) => {
    logger.warn({ pid: worker.process.pid, code, signal }, '☠️ worker died, respawning')
    cluster.fork()
  })

  const stopAll = (): void => {
    logger.info('🛑 primary received signal, stopping workers')
    for (const id of Object.keys(cluster.workers ?? {})) {
      cluster.workers?.[id]?.send({ type: 'shutdown' })
    }
    setTimeout(() => process.exit(0), 6_000).unref()
  }
  process.on('SIGTERM', stopAll)
  process.on('SIGINT', stopAll)
}
