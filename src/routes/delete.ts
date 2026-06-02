import type { FastifyInstance } from 'fastify'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createLogger } from '../logger.js'
const logger = createLogger('DeleteRoute')
import { safeJoin } from '../utils/path-safe.js'

interface DeleteBody {
  filename?: string
  path?: string
}

async function tryUnlink(file: string): Promise<boolean> {
  try {
    await fs.access(file)
    await fs.unlink(file)
    return true
  } catch (err) {
    const e = err as NodeJS.ErrnoException
    if (e.code === 'ENOENT') return false
    throw err
  }
}

export function deleteRoutes(app: FastifyInstance): void {
  app.delete('/delete_image', async (req, reply) => {
    const body = (req.body ?? {}) as DeleteBody
    if (!body.filename) {
      return reply.code(400).send({
        status: false,
        message: 'body filename is not defined',
        debug: `body filename is ${body.filename}`
      })
    }

    const baseDir = path.resolve('./storage/images')
    let target: string
    try {
      target = path.join(safeJoin(baseDir, body.path ?? null), body.filename)
      if (!target.startsWith(baseDir)) throw new Error('escape')
    } catch {
      return reply.code(400).send({ status: false, message: 'Invalid path.' })
    }

    try {
      const ok = await tryUnlink(target)
      if (!ok) return reply.code(404).send({ status: false, message: `file ${body.filename} not found` })
      return reply.code(200).send({ status: true, message: 'File has been deleted successfully.' })
    } catch (err) {
      logger.error({ err, module: 'delete' }, 'image delete failed')
      return reply.code(500).send({ status: false, message: `Unable to delete file ${body.filename}` })
    }
  })

  app.delete('/delete_asset', async (req, reply) => {
    const body = (req.body ?? {}) as DeleteBody
    if (!body.filename) {
      return reply.code(400).send({
        status: false,
        message: 'body filename is not defined',
        debug: `body filename is ${body.filename}`
      })
    }

    const baseDir = path.resolve('./storage/assets')
    let target: string
    try {
      target = path.join(safeJoin(baseDir, body.path ?? null), body.filename)
      if (!target.startsWith(baseDir)) throw new Error('escape')
    } catch {
      return reply.code(400).send({ status: false, message: 'Invalid path.' })
    }

    try {
      const ok = await tryUnlink(target)
      if (!ok) return reply.code(404).send({ status: false, message: `file ${body.filename} not found` })
      return reply.code(200).send({ status: true, message: 'File has been deleted successfully.' })
    } catch (err) {
      logger.error({ err, module: 'delete' }, 'asset delete failed')
      return reply.code(500).send({ status: false, message: `Unable to delete file ${body.filename}` })
    }
  })
}
