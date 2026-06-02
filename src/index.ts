#!/usr/bin/env node
import cluster from 'node:cluster'
import { printBanner } from './banner.js'
import { runWithCluster } from './cluster.js'
import { config } from './config/index.js'
import { createLogger } from './logger.js'
import { applyRuntimeTuning } from './runtime-tuning.js'
import { startServer, stopServer } from './server.js'
import type { FastifyInstance } from 'fastify'

const log = createLogger('Bootstrap')

process.on('unhandledRejection', (reason) => {
  log.error({ reason }, 'unhandledRejection')
})
process.on('uncaughtException', (err) => {
  log.fatal({ err }, 'uncaughtException')
  process.exit(1)
})

function attachShutdown(app: FastifyInstance): void {
  let shuttingDown = false
  const timeoutMs = Number(process.env.RYUNACDN_SHUTDOWN_TIMEOUT_MS ?? 4_000)

  const handle = async (signal: NodeJS.Signals): Promise<void> => {
    if (shuttingDown) return
    shuttingDown = true
    log.info({ signal, timeoutMs }, '🛑 graceful shutdown started')

    const force = setTimeout(() => {
      log.warn({ timeoutMs }, '⏰ shutdown timeout exceeded, forcing exit')
      process.exit(1)
    }, timeoutMs).unref()

    try {
      await stopServer(app)
      clearTimeout(force)
      log.info({ signal }, '👋 shutdown complete')
      process.exit(0)
    } catch (err) {
      log.error({ err }, 'shutdown error')
      process.exit(1)
    }
  }

  process.on('SIGTERM', () => void handle('SIGTERM'))
  process.on('SIGINT', () => void handle('SIGINT'))
}

async function main(): Promise<void> {
  applyRuntimeTuning()

  if (!cluster.isWorker) {
    printBanner({
      version: '1.0.0',
      env: config.get<string>('env'),
      node: process.version,
      port: config.get<number>('server.port'),
      host: config.get<string>('server.host'),
      protocol: config.get<string>('server.protocol')
    })
  }

  if (config.get<boolean>('cluster')) {
    await runWithCluster()
    return
  }

  const app = await startServer()
  attachShutdown(app)
  log.info({ pid: process.pid }, '🚀 server ready')
}

main().catch((err) => {
  log.fatal({ err }, '❌ failed to start')
  process.exit(1)
})
