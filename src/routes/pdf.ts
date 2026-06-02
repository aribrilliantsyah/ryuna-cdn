import type { FastifyInstance } from 'fastify'
import fs from 'node:fs/promises'
import path from 'node:path'
import puppeteer from 'puppeteer'
import { config } from '../config/index.js'
import { createLogger } from '../logger.js'
const logger = createLogger('PdfRoute')

interface PdfBody {
  url?: string
  format?: 'A0' | 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6' | 'Letter' | 'Legal' | 'Tabloid' | 'Ledger'
  landscape?: boolean
  filename?: string
}

function isAllowedUrl(input: string): boolean {
  try {
    const u = new URL(input)
    if (!['http:', 'https:'].includes(u.protocol)) return false
    return true
  } catch {
    return false
  }
}

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

export function pdfRoutes(app: FastifyInstance): void {
  app.post('/page_to_pdf', async (req, reply) => {
    const body = (req.body ?? {}) as PdfBody
    if (!body.url || !isAllowedUrl(body.url)) {
      return reply.code(400).send({ status: false, message: 'A valid http(s) `url` is required' })
    }
    if (!body.filename) {
      return reply.code(400).send({ status: false, message: '`filename` is required' })
    }

    const filename = `${Date.now()}-${sanitiseFilename(body.filename)}`
    const destDir = path.resolve('./storage/assets')
    await fs.mkdir(destDir, { recursive: true })
    const fullPath = path.join(destDir, filename)

    let browser
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })
      const page = await browser.newPage()
      await page.goto(body.url, { waitUntil: 'networkidle2', timeout: 60_000 })
      await page.pdf({
        path: fullPath,
        format: body.format ?? 'A4',
        landscape: body.landscape ?? false,
        printBackground: true
      })
    } catch (err) {
      logger.error({ err, module: 'pdf' }, 'pdf render failed')
      return reply.code(500).send({ status: false, message: 'Failed to render PDF.' })
    } finally {
      await browser?.close()
    }

    return reply.code(200).send({
      status: true,
      message: 'Page has been exported to PDF successfully.',
      filename,
      url: `${publicUrl(req)}/${filename}`
    })
  })
}
