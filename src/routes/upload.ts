import type { FastifyInstance } from 'fastify'
import { fileTypeFromBuffer } from 'file-type'
import fs from 'node:fs/promises'
import path from 'node:path'
import { config } from '../config/index.js'
import { createLogger } from '../logger.js'
const logger = createLogger('UploadRoute')
import { safeJoin } from '../utils/path-safe.js'

const IMAGE_EXTS = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif'])
const IMAGE_MIMES = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/avif'
])

function sanitiseFilename(name: string): string {
  return name.replace(/\s+/g, '-').replace(/[^a-z0-9._-]/gi, '').toLowerCase()
}

function publicUrl(req: { headers: { host?: string } }): string {
  const publicHost = config.get<string>('publicUrl.host')
  if (publicHost) {
    const port = config.get<number>('publicUrl.port')
    return `${config.get<string>('publicUrl.protocol')}://${publicHost}:${port}`
  }
  const protocol = config.get<string>('server.protocol')
  const port = config.get<number>('server.port')
  const host = req.headers.host?.split(':')[0] ?? '127.0.0.1'
  return `${protocol}://${host}:${port}`
}

export function uploadRoutes(app: FastifyInstance): void {
  app.post('/upload_image', async (req, reply) => {
    const data = await req.file().catch(() => null)
    if (!data) return reply.code(400).send({ status: false, message: 'No image part provided' })

    const buf = await data.toBuffer()
    const ext = path.extname(data.filename).slice(1).toLowerCase()
    if (!IMAGE_EXTS.has(ext)) {
      return reply.code(400).send({ status: false, message: 'Only images are allowed.' })
    }
    const sniff = await fileTypeFromBuffer(buf)
    if (!sniff || !IMAGE_MIMES.has(sniff.mime)) {
      return reply
        .code(400)
        .send({ status: false, message: 'File content does not match an allowed image type.' })
    }

    const customPath = ((data.fields.path as { value?: string } | undefined)?.value ?? '').trim()
    const baseDir = path.resolve('./storage/images')
    let destDir: string
    try {
      destDir = safeJoin(baseDir, customPath || null)
    } catch (err) {
      return reply.code(400).send({ status: false, message: 'Invalid path.', debug: (err as Error).message })
    }

    const filename = `${Date.now()}-${sanitiseFilename(data.filename)}`
    const fullPath = path.join(destDir, filename)

    try {
      await fs.mkdir(destDir, { recursive: true })
      await fs.writeFile(fullPath, buf)
    } catch (err) {
      logger.error({ err, module: 'upload' }, 'image upload failed')
      return reply.code(500).send({ status: false, message: 'Unable to upload image.' })
    }

    const relativePath = customPath ? `${customPath.replace(/^\/+|\/+$/g, '')}/${filename}` : filename
    return reply.code(200).send({
      status: true,
      message: 'Image has been uploaded successfully.',
      filename,
      url: `${publicUrl(req)}/${relativePath}`
    })
  })

  app.post('/upload_file', async (req, reply) => {
    const data = await req.file().catch(() => null)
    if (!data) return reply.code(400).send({ status: false, message: 'No file part provided' })

    const buf = await data.toBuffer()
    const ext = path.extname(data.filename).slice(1).toLowerCase()
    if (IMAGE_EXTS.has(ext)) {
      return reply.code(400).send({
        status: false,
        message: 'File not allowed. Use /upload_image for images.'
      })
    }

    const customPath = ((data.fields.path as { value?: string } | undefined)?.value ?? '').trim()
    const baseDir = path.resolve('./storage/assets')
    let destDir: string
    try {
      destDir = safeJoin(baseDir, customPath || null)
    } catch (err) {
      return reply.code(400).send({ status: false, message: 'Invalid path.', debug: (err as Error).message })
    }

    const filename = `${Date.now()}-${sanitiseFilename(data.filename)}`
    const fullPath = path.join(destDir, filename)

    try {
      await fs.mkdir(destDir, { recursive: true })
      await fs.writeFile(fullPath, buf)
    } catch (err) {
      logger.error({ err, module: 'upload' }, 'asset upload failed')
      return reply.code(500).send({ status: false, message: 'Unable to upload file.' })
    }

    const relativePath = customPath ? `${customPath.replace(/^\/+|\/+$/g, '')}/${filename}` : filename
    return reply.code(200).send({
      status: true,
      message: 'File has been uploaded successfully.',
      filename,
      url: `${publicUrl(req)}/${relativePath}`
    })
  })
}
