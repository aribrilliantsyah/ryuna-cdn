import fs from 'node:fs'
import { config } from '../config/index.js'

export class Missing {
  async get({
    domain,
    isDirectory = false
  }: {
    domain?: string
    isDirectory?: boolean
  }): Promise<Buffer> {
    const enabled = config.get<boolean>('notFound.images.enabled', domain)
    const imagePath = enabled ? config.get<string>('notFound.images.path', domain) : null

    if (!imagePath || isDirectory) {
      throw Object.assign(new Error('Not found'), { statusCode: 404 })
    }

    try {
      const buf = await fs.promises.readFile(imagePath)
      if (buf.byteLength === 0) {
        throw Object.assign(new Error('File size is 0 bytes'), { statusCode: 404 })
      }
      return buf
    } catch (err) {
      const e = err as NodeJS.ErrnoException
      throw Object.assign(new Error(`File not found: ${imagePath}`), {
        statusCode: 404,
        cause: e
      })
    }
  }
}
