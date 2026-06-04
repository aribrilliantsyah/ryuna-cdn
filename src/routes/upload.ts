import type { FastifyInstance, FastifyRequest } from 'fastify'
import type { MultipartFile, MultipartValue } from '@fastify/multipart'
import { fileTypeFromBuffer } from 'file-type'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createLogger } from '../logger.js'
const logger = createLogger('UploadRoute')
import { safeJoin } from '../utils/path-safe.js'
import { publicUrl } from '../utils/public-url.js'

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

interface CollectedUpload {
  buf: Buffer
  filename: string
  customPath: string
}

async function collectUpload(req: FastifyRequest): Promise<CollectedUpload | null> {
  let file: { buf: Buffer; filename: string } | null = null
  let customPath = ''

  for await (const part of req.parts()) {
    if (part.type === 'file') {
      const filePart = part as MultipartFile
      if (file) {
        await filePart.toBuffer().catch(() => undefined)
        continue
      }
      const buf = await filePart.toBuffer()
      file = { buf, filename: filePart.filename }
    } else {
      const fieldPart = part as MultipartValue
      if (fieldPart.fieldname === 'path' && typeof fieldPart.value === 'string') {
        customPath = fieldPart.value.trim()
      }
    }
  }

  if (!file) return null
  return { buf: file.buf, filename: file.filename, customPath }
}

export function uploadRoutes(app: FastifyInstance): void {
  app.post('/upload_image', async (req, reply) => {
    const data = await collectUpload(req).catch((err) => {
      logger.error({ err, module: 'upload' }, 'multipart parse failed')
      return null
    })
    if (!data) return reply.code(400).send({ status: false, message: 'No image part provided' })

    const { buf, filename: origName, customPath } = data
    const ext = path.extname(origName).slice(1).toLowerCase()
    if (!IMAGE_EXTS.has(ext)) {
      return reply.code(400).send({ status: false, message: 'Only images are allowed.' })
    }
    const sniff = await fileTypeFromBuffer(buf)
    if (!sniff || !IMAGE_MIMES.has(sniff.mime)) {
      return reply
        .code(400)
        .send({ status: false, message: 'File content does not match an allowed image type.' })
    }

    const baseDir = path.resolve('./storage/images')
    let destDir: string
    try {
      destDir = safeJoin(baseDir, customPath || null)
    } catch (err) {
      return reply.code(400).send({ status: false, message: 'Invalid path.', debug: (err as Error).message })
    }

    const filename = `${Date.now()}-${sanitiseFilename(origName)}`
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
    const data = await collectUpload(req).catch((err) => {
      logger.error({ err, module: 'upload' }, 'multipart parse failed')
      return null
    })
    if (!data) return reply.code(400).send({ status: false, message: 'No file part provided' })

    const { buf, filename: origName, customPath } = data
    const ext = path.extname(origName).slice(1).toLowerCase()
    if (IMAGE_EXTS.has(ext)) {
      return reply.code(400).send({
        status: false,
        message: 'File not allowed. Use /upload_image for images.'
      })
    }

    const baseDir = path.resolve('./storage/assets')
    let destDir: string
    try {
      destDir = safeJoin(baseDir, customPath || null)
    } catch (err) {
      return reply.code(400).send({ status: false, message: 'Invalid path.', debug: (err as Error).message })
    }

    const filename = `${Date.now()}-${sanitiseFilename(origName)}`
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
