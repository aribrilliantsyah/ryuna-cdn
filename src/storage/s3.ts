import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3'
import path from 'node:path'
import { config } from '../config/index.js'
import { createLogger } from '../logger.js'
const logger = createLogger('S3Storage')
import type { StorageAdapter } from '../types.js'
import { streamToBuffer } from '../utils/stream.js'
import { Missing } from './missing.js'

export class S3Storage implements StorageAdapter {
  url: string
  domain?: string
  bucketName: string
  providerType = 'Amazon S3'
  lastModified?: Date
  notFound = false
  private urlParts: string[]
  private client: S3Client

  constructor({
    assetType,
    domain,
    url
  }: { assetType: 'images' | 'assets'; domain?: string; url: string }) {
    const region = config.get<string>(`${assetType}.s3.region`)
    const endpoint = config.get<string>(`${assetType}.s3.endpoint`)
    const accessKeyId = config.get<string>(`${assetType}.s3.accessKey`)
    const secretAccessKey = config.get<string>(`${assetType}.s3.secretKey`)

    if (endpoint) this.providerType = 'S3-compatible'

    this.bucketName = config.get<string>(`${assetType}.s3.bucketName`)
    this.domain = domain
    this.url = url
    this.urlParts = this.parseUrlParts(url)
    this.client = new S3Client({
      region: region || undefined,
      endpoint: endpoint || undefined,
      forcePathStyle: !!endpoint,
      credentials:
        accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined
    })
  }

  private parseUrlParts(url: string): string[] {
    let canonical = url
    if (canonical.startsWith('/s3/')) canonical = canonical.slice(4)
    if (canonical.startsWith('/')) canonical = canonical.slice(1)
    return canonical.split('/').filter(Boolean)
  }

  private getBucket(): string {
    if (this.url.startsWith('/s3')) return this.urlParts[0] ?? this.bucketName
    return this.bucketName
  }

  private getKey(): string {
    const parts = this.url.startsWith('/s3') ? this.urlParts.slice(1) : this.urlParts
    return decodeURIComponent(parts.join('/'))
  }

  getFullUrl(): string {
    return this.url
  }

  getLastModified(): Date | undefined {
    return this.lastModified
  }

  async get(): Promise<Buffer> {
    const Bucket = this.getBucket()
    const Key = this.getKey()

    logger.debug({ provider: this.providerType, Bucket, Key, url: this.url }, 'S3 request')

    if (!Bucket || !Key) {
      throw Object.assign(new Error('No bucket or key provided'), { statusCode: 400 })
    }

    try {
      const res = await this.client.send(new GetObjectCommand({ Bucket, Key }))
      if (res.LastModified) this.lastModified = res.LastModified
      if (!res.Body) throw Object.assign(new Error('Empty S3 body'), { statusCode: 404 })
      return await streamToBuffer(res.Body as NodeJS.ReadableStream as never)
    } catch (err) {
      const e = err as { $metadata?: { httpStatusCode?: number }; name?: string }
      const status = e.$metadata?.httpStatusCode
      if (status === 404 || e.name === 'NoSuchKey') {
        try {
          const buf = await new Missing().get({
            domain: this.domain,
            isDirectory: path.parse(this.getFullUrl()).ext === ''
          })
          this.notFound = true
          this.lastModified = new Date()
          return buf
        } catch {
          throw Object.assign(new Error(`Not Found: ${this.url}`), { statusCode: 404 })
        }
      }
      throw err
    }
  }
}
