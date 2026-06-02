import exifReader from 'exif-reader'
import type { FastifyRequest } from 'fastify'
import { BitmapImage, GifFrame, GifUtil } from 'gifwrap'
import fs from 'node:fs/promises'
import path from 'node:path'
import sharp, { type ResizeOptions, type Sharp } from 'sharp'
import smartcrop from 'smartcrop-sharp'
import { cache } from '../cache/index.js'
import { config } from '../config/index.js'
import { createLogger } from '../logger.js'
const logger = createLogger('ImageHandler')
import { createStorage } from '../storage/factory.js'
import { sha1 } from '../utils/hash.js'
import { BaseHandler, type HandlerInit } from './base.js'

interface ImageParam {
  name: string
  aliases: string[]
  default?: string | number
  allowZero?: boolean
  minimumValue?: number
  maximumValue?: number
  lowercase?: boolean
}

export const IMAGE_PARAMETERS: ImageParam[] = [
  { name: 'format', aliases: ['fmt'] },
  { name: 'quality', aliases: ['q'], default: 75 },
  { name: 'sharpen', aliases: ['sh'], default: 0, allowZero: true, minimumValue: 1 },
  { name: 'saturate', aliases: ['sat'], default: 1, allowZero: true },
  { name: 'width', aliases: ['w'] },
  { name: 'height', aliases: ['h'] },
  { name: 'ratio', aliases: ['rx'] },
  { name: 'cropX', aliases: ['cx'] },
  { name: 'cropY', aliases: ['cy'] },
  { name: 'crop', aliases: ['coords'] },
  { name: 'resizeStyle', aliases: ['resize'] },
  { name: 'devicePixelRatio', aliases: ['dpr'] },
  { name: 'gravity', aliases: ['g'], default: 'None' },
  { name: 'filter', aliases: ['f'], default: 'lanczos', lowercase: true },
  { name: 'trim', aliases: ['t'] },
  { name: 'trimFuzz', aliases: ['tf'] },
  { name: 'blur', aliases: ['b'] },
  { name: 'strip', aliases: ['s'] },
  { name: 'rotate', aliases: ['r'] },
  { name: 'flip', aliases: ['fl'] },
  { name: 'progressive', aliases: ['pg'] }
]

type Gravity =
  | 'northwest' | 'north' | 'northeast'
  | 'west' | 'center' | 'east'
  | 'southwest' | 'south' | 'southeast'
  | 'none'

const GRAVITY_MAP: Record<string, Gravity> = {
  nw: 'northwest', n: 'north', ne: 'northeast',
  w: 'west', c: 'center', e: 'east',
  sw: 'southwest', s: 'south', se: 'southeast',
  none: 'none'
}

interface ImageOptions {
  format?: string
  quality?: number
  sharpen?: number
  saturate?: number
  width?: number
  height?: number
  ratio?: string
  cropX?: number
  cropY?: number
  crop?: string
  resizeStyle?: 'aspectfit' | 'aspectfill' | 'fill' | 'crop' | 'entropy'
  devicePixelRatio?: number
  gravity?: string
  filter?: string
  trim?: number
  trimFuzz?: number
  blur?: number
  strip?: number
  rotate?: number
  flip?: 'x' | 'y' | 'xy'
  progressive?: string | boolean
  compress?: boolean
}

interface ImageMetadata {
  width: number
  height: number
  format: string
  exif?: Buffer
}

const tmpDir = path.resolve('./workspace/_tmp')
await fs.mkdir(tmpDir, { recursive: true }).catch(() => {})

function aspectFit(srcW: number, srcH: number, dstW: number, dstH: number): { width: number; height: number; scale: number } {
  const scale = Math.min(dstW / srcW, dstH / srcH)
  return { width: srcW * scale, height: srcH * scale, scale }
}

export class ImageHandler extends BaseHandler {
  private format: string
  private fileName: string
  private fileExt: string
  private exifData: Record<string, unknown> = {}
  private isExternalUrl: boolean
  private requestUrl: string
  private parsedUrl: { asset: URL; original: URL; cdn: URL }
  private imageData?: ImageMetadata
  private calculatedDimensions?: { width: number; height: number }
  private entropy?: { x1: number; y1: number; x2: number; y2: number }
  private contentType?: string

  constructor(format: string, req: FastifyRequest, init: HandlerInit = {}) {
    super(req, init)
    this.format = format
    this.requestUrl = req.url

    this.parsedUrl = this.parseUrl(req.url)
    const pathname = this.parsedUrl.cdn.pathname.slice(1)
    this.fileName = path.basename(this.parsedUrl.original.pathname)
    this.fileExt = path.extname(this.fileName).slice(1) || format

    this.isExternalUrl = pathname.startsWith('http://') || pathname.startsWith('https://')
  }

  override setBaseUrl(url: string): void {
    super.setBaseUrl(url)
    this.parsedUrl = this.parseUrl(url)
  }

  private parseUrl(url: string): { asset: URL; original: URL; cdn: URL } {
    const parsed = new URL(url, 'http://x')
    const searchSegments = parsed.search ? parsed.search.split('?') : ['']
    const cdnUrl = new URL(`${parsed.pathname}?${searchSegments.slice(-1)[0]}`, 'http://x')
    let assetUrl = parsed.pathname
    if (searchSegments.length > 2) {
      assetUrl += `?${searchSegments.slice(-2, -1)[0]}`
    }
    return {
      asset: new URL(assetUrl, 'http://x'),
      original: parsed,
      cdn: cdnUrl
    }
  }

  override getLastModified(): Date | undefined {
    return this.storageHandler?.getLastModified()
  }

  getContentType(): string {
    if (this.contentType) return this.contentType
    if (this.options.format === 'json') return 'application/json'
    let out = this.format
    if (
      this.storageHandler?.notFound &&
      config.get<boolean>('notFound.images.enabled', this.req.ctx?.domain)
    ) {
      out = path.extname(config.get<string>('notFound.images.path')).slice(1)
    }
    switch (out.toLowerCase()) {
      case 'png': return 'image/png'
      case 'jpg':
      case 'jpeg': return 'image/jpeg'
      case 'gif': return 'image/gif'
      case 'webp': return 'image/webp'
      case 'avif': return 'image/avif'
      default: return 'image/jpeg'
    }
  }

  getFilename(): string {
    if (path.extname(this.fileName) === '') return `${this.fileName}.${this.fileExt}`
    return this.fileName
  }

  async get(): Promise<Buffer> {
    const domain = this.req.ctx?.domain
    const assetPath = this.parsedUrl.asset.pathname

    const merged = { ...this.options, ...Object.fromEntries(this.parsedUrl.cdn.searchParams) }
    this.options = merged
    const needsProcessing = Object.keys(this.options).length > 0

    if (
      this.isExternalUrl &&
      (!config.get<boolean>('images.remote.enabled', domain) ||
        !config.get<boolean>('images.remote.allowFullURL', domain))
    ) {
      throw Object.assign(new Error('Loading images from a full remote URL is not supported'), {
        statusCode: 403
      })
    }

    this.options = this.sanitiseOptions(this.options)
    this.resolveFormat()

    this.storageHandler = createStorage('image', assetPath, { domain })

    const cacheKey = [
      sha1(JSON.stringify(this.options) + this.req.url),
      domain,
      this.parsedUrl.cdn.pathname,
      this.parsedUrl.cdn.search.slice(1)
    ]
    const ttl = config.get<number>('caching.ttl', domain)
    const isJSONResponse = this.options.format === 'json'

    const cached = await cache().get(cacheKey)
    if (cached) {
      this.isCached = true
      const meta = await cache().getMetadata(cacheKey)
      if (meta?.errorCode) {
        ;(this.storageHandler as unknown as { notFound: boolean }).notFound = true
        this.contentType = (meta.contentType as string) ?? 'application/json'
      }
      if (meta?.lastModified) {
        ;(this.storageHandler as unknown as { lastModified: Date }).lastModified = new Date(
          meta.lastModified as string
        )
      }
      return cached
    }

    try {
      const imageBuffer = await this.storageHandler.get().then((d) =>
        Buffer.isBuffer(d) ? d : Buffer.from(d as unknown as ArrayBuffer)
      )

      if (!needsProcessing) {
        await cache().set(cacheKey, imageBuffer, {
          ttl,
          metadata: { lastModified: this.storageHandler.getLastModified()?.toISOString() }
        })
        return imageBuffer
      }

      const maxMegapixels = Number(process.env.RYUNACDN_MAX_MEGAPIXELS ?? 100)
      let sharpImage = sharp(imageBuffer, {
        limitInputPixels: maxMegapixels * 1_000_000,
        failOn: 'none'
      })
      const meta = await sharpImage.metadata()
      const px = (meta.width ?? 0) * (meta.height ?? 0)
      if (px > maxMegapixels * 1_000_000) {
        throw Object.assign(
          new Error(`Image too large: ${px} pixels exceeds ${maxMegapixels} MP limit`),
          { statusCode: 413 }
        )
      }
      this.imageData = {
        width: meta.width ?? 0,
        height: meta.height ?? 0,
        format: (meta.format === 'jpeg' ? 'jpg' : meta.format) ?? 'jpg',
        exif: meta.exif as Buffer | undefined
      }
      if (this.imageData.exif) {
        try {
          this.exifData = exifReader(this.imageData.exif) as Record<string, unknown>
        } catch {}
      }
      this.calculatedDimensions = this.getCalculatedDimensions(this.imageData.width, this.imageData.height)

      sharpImage = await this.process(sharpImage, imageBuffer)
      await this.checkCropRectangle()

      let output: Buffer
      if (isJSONResponse) {
        const sharpBuf = await sharpImage.toBuffer()
        const info = await this.getImageInfo(imageBuffer, sharpBuf)
        output = Buffer.from(JSON.stringify({ ...info, data: sharpBuf.toString('base64') }))
      } else {
        const buf = await sharpImage.toBuffer()
        const format = String(this.options.format ?? this.imageData.format).toLowerCase()
        if (format === 'gif') {
          output = await this.processGif(buf)
        } else {
          output = buf
        }
      }

      if (!this.isCached) {
        await cache().set(cacheKey, output, {
          ttl,
          metadata: {
            lastModified: this.storageHandler.getLastModified()?.toISOString(),
            ...(this.storageHandler.notFound
              ? { contentType: this.getContentType(), errorCode: 404 }
              : {})
          }
        })
      }

      return output
    } catch (err) {
      const e = err as { statusCode?: number; message?: string }
      if (e.statusCode === 404 && config.get<boolean>('caching.cache404', domain) && !this.isCached) {
        await cache().set(cacheKey, JSON.stringify(e), { metadata: { errorCode: 404 } })
      }
      throw err
    }
  }

  private resolveFormat(): void {
    const ALLOWED = new Set(['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'json'])
    const fmts = String(this.options.format ?? this.fileExt).toLowerCase().split(',')

    for (const f of fmts) {
      if (!ALLOWED.has(f)) {
        throw Object.assign(
          new Error(
            `Invalid format '${f}'. Allowed: ${[...ALLOWED].join(', ')}`
          ),
          { statusCode: 400 }
        )
      }
    }

    const acceptHeader = ((this.req.headers.accept as string) ?? '').split(',')
    const chosen = fmts.find((f, i) => {
      if (i === fmts.length - 1) return true
      if (f === 'webp') return acceptHeader.includes('image/webp')
      if (f === 'avif') return acceptHeader.includes('image/avif')
      return true
    })
    this.options.format = chosen
    if (chosen === 'json') {
      this.format = this.fileExt === this.fileName ? 'PNG' : this.fileExt
    } else {
      this.format = chosen ?? this.fileExt
    }
  }

  private async checkCropRectangle(): Promise<void> {
    const o = this.options as ImageOptions
    if (o.cropX === undefined || o.cropY === undefined || !this.calculatedDimensions || !this.imageData) return
    if (
      this.calculatedDimensions.width + Number(o.cropX) >= this.imageData.width ||
      this.calculatedDimensions.height + Number(o.cropY) >= this.imageData.height
    ) {
      const rect = `${this.calculatedDimensions.width + Number(o.cropX)}x${
        this.calculatedDimensions.height + Number(o.cropY)
      }`
      const orig = `${this.imageData.width}x${this.imageData.height}`
      throw Object.assign(
        new Error(
          `The calculated crop rectangle is larger than the original image size. Crop: ${rect}, Image: ${orig}`
        ),
        { statusCode: 400 }
      )
    }
  }

  private getCalculatedDimensions(width: number, height: number): { width: number; height: number } {
    const o = this.options as ImageOptions
    const dims = { width, height }
    const ratioMatch = o.ratio?.match(/^(\d+)-(\d+)$/)

    if (ratioMatch) {
      const ratio = Number.parseFloat(ratioMatch[2]!) / Number.parseFloat(ratioMatch[1]!)
      if (o.width !== undefined && o.height === undefined) {
        dims.width = o.width
        dims.height = Math.ceil(o.width * ratio)
      } else if (o.width === undefined && o.height !== undefined) {
        dims.width = Math.ceil(o.height / ratio)
        dims.height = o.height
      } else if (o.width === undefined && o.height === undefined) {
        dims.height = Math.ceil(dims.width * ratio)
      } else {
        dims.width = o.width!
        dims.height = o.height!
      }
    } else {
      dims.width = o.width ?? dims.width
      dims.height = o.height ?? dims.height
    }

    dims.width = Math.min(dims.width, config.get<number>('security.maxWidth'))
    dims.height = Math.min(dims.height, config.get<number>('security.maxHeight'))

    if (o.devicePixelRatio && o.devicePixelRatio < 4) {
      dims.width = Math.round(dims.width * o.devicePixelRatio)
      dims.height = Math.round(dims.height * o.devicePixelRatio)
    }
    return dims
  }

  private cropOffsetsByGravity(
    gravity: string,
    cropped: { width: number; height: number },
    scale: number
  ): { x1: number; y1: number; x2: number; y2: number } {
    if (!this.imageData) return { x1: 0, y1: 0, x2: cropped.width, y2: cropped.height }
    const resizedW = this.imageData.width * scale
    const resizedH = this.imageData.height * scale
    const g = GRAVITY_MAP[gravity.toLowerCase()] ?? 'none'
    let vy = 0
    let hx = 0
    if (g === 'center' || g === 'east' || g === 'west') vy = Math.max((resizedH - cropped.height) / 2, 0)
    else if (g === 'southwest' || g === 'south' || g === 'southeast') vy = resizedH - cropped.height
    if (g === 'center' || g === 'north' || g === 'south') hx = Math.max((resizedW - cropped.width) / 2, 0)
    else if (g === 'northeast' || g === 'east' || g === 'southeast') hx = resizedW - cropped.width
    return {
      x1: Math.floor(hx),
      y1: Math.floor(vy),
      x2: Math.floor(hx + cropped.width),
      y2: Math.floor(vy + cropped.height)
    }
  }

  private async extractEntropy(
    buffer: Buffer,
    width: number,
    height: number
  ): Promise<{ x1: number; y1: number; x2: number; y2: number }> {
    const res = await smartcrop.crop(buffer, { width, height })
    return {
      x1: res.topCrop.x,
      y1: res.topCrop.y,
      x2: res.topCrop.x + res.topCrop.width,
      y2: res.topCrop.y + res.topCrop.height
    }
  }

  private async process(sharpImage: Sharp, imageBuffer: Buffer): Promise<Sharp> {
    const o = this.options as ImageOptions
    if (!o.resizeStyle) {
      o.resizeStyle = o.width && o.height ? (o.gravity ? 'aspectfill' : 'entropy') : 'aspectfit'
    }
    if (this.storageHandler?.notFound) o.resizeStyle = 'entropy'
    else if (o.ratio) o.resizeStyle = 'aspectfill'

    const dims = this.calculatedDimensions!
    const { width, height } = dims
    let resized: Sharp = sharpImage

    const resizeOpts: ResizeOptions = {
      kernel: config.get<string>('engines.sharp.kernel') as ResizeOptions['kernel']
    }

    if (this.imageData) {
      if (width && height && o.cropX !== undefined && o.cropY !== undefined) {
        resized = resized.extract({
          left: Number(o.cropX),
          top: Number(o.cropY),
          width: width + Number(o.cropX),
          height: height + Number(o.cropY)
        })
      } else if (width && height) {
        switch (o.resizeStyle) {
          case 'aspectfit': {
            const size = aspectFit(this.imageData.width, this.imageData.height, width, height)
            resized = resized.resize(Math.round(size.width), Math.round(size.height), resizeOpts)
            break
          }
          case 'aspectfill': {
            const scaleW = width / this.imageData.width
            const scaleH = height / this.imageData.height
            const scale = Math.max(scaleW, scaleH)
            const crops = this.cropOffsetsByGravity(o.gravity ?? 'none', { width, height }, scale)
            if (scaleH >= scaleW) {
              resized = resized.resize(
                Math.round(scale * this.imageData.width),
                height,
                resizeOpts
              )
            } else {
              resized = resized.resize(
                width,
                Math.round(scale * this.imageData.height),
                resizeOpts
              )
            }
            if (width / height !== this.imageData.width / this.imageData.height) {
              resized = resized.extract({
                left: crops.x1,
                top: crops.y1,
                width: crops.x2 - crops.x1,
                height: crops.y2 - crops.y1
              })
            }
            break
          }
          case 'fill':
            resized = resized.resize(width, height, { ...resizeOpts, fit: 'fill' })
            break
          case 'crop':
            if (o.crop) {
              const coords = o.crop.split(',').map((c) => Number.parseInt(c, 10))
              if (coords.length === 2) {
                coords.push(height - coords[0]!)
                coords.push(width - coords[1]!)
              }
              const cropDims = {
                left: coords[1]!,
                top: coords[0]!,
                width: coords[3]! - coords[1]!,
                height: coords[2]! - coords[0]!
              }
              resized = resized.extract(cropDims)
              if (o.width || o.height) {
                const opts = o.width && o.height ? { ...resizeOpts, fit: 'fill' as const } : resizeOpts
                if (o.devicePixelRatio && o.devicePixelRatio < 4) {
                  resized = resized.resize(
                    o.width ? Math.round(o.width * o.devicePixelRatio) : undefined,
                    o.height ? Math.round(o.height * o.devicePixelRatio) : undefined,
                    opts
                  )
                } else {
                  resized = resized.resize(o.width ?? undefined, o.height ?? undefined, opts)
                }
              } else if (o.devicePixelRatio && o.devicePixelRatio < 4) {
                resized = resized.resize(
                  Math.round(cropDims.width * o.devicePixelRatio),
                  Math.round(cropDims.height * o.devicePixelRatio),
                  resizeOpts
                )
              }
            } else {
              const excessW = Math.max(0, this.imageData.width - width)
              const excessH = Math.max(0, this.imageData.height - height)
              resized = resized.extract({
                left: Math.round(excessW / 2),
                top: Math.round(excessH / 2),
                width,
                height
              })
            }
            break
          case 'entropy': {
            const entropy = await this.extractEntropy(imageBuffer, width, height)
            this.entropy = entropy
            resized = resized.extract({
              left: entropy.x1,
              top: entropy.y1,
              width: entropy.x2 - entropy.x1,
              height: entropy.y2 - entropy.y1
            })
            resized = resized.resize(width, height)
            break
          }
        }
      } else if (width && !height) {
        resized = resized.resize(width, null, resizeOpts)
      }
    }

    if (o.blur) resized = resized.blur(Number(o.blur))
    if (o.flip === 'x') resized = resized.flop()
    else if (o.flip === 'y') resized = resized.flip()
    else if (o.flip === 'xy') resized = resized.flip().flop()
    if (o.rotate) resized = resized.rotate(Number(o.rotate))
    if ((o.saturate ?? 1) < 1) resized = resized.greyscale()
    if (o.sharpen) resized = resized.sharpen({ sigma: Number(o.sharpen) })

    const format = String(o.format === 'json' ? this.imageData?.format : o.format).toLowerCase()
    const quality = Number(o.quality ?? 75)

    switch (format) {
      case 'jpg':
      case 'jpeg':
        return resized.jpeg({
          quality,
          mozjpeg: true,
          progressive: o.progressive === 'true' || o.progressive === true
        })
      case 'png': {
        const compressionLevel = Math.max(Math.min(Math.round(quality * -0.09 + 9), 9), 1)
        return resized.png({ compressionLevel })
      }
      case 'webp':
        return resized.webp({ quality })
      case 'avif':
        return resized.avif({ quality })
      case 'gif':
        return resized.gif()
      default:
        return resized.jpeg({ quality, mozjpeg: true })
    }
  }

  private async processGif(buffer: Buffer): Promise<Buffer> {
    try {
      const { data, info } = await sharp(buffer)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })
      // gifwrap types only describe the (w, h, fill) overload, but the
      // single-object form is supported at runtime.
      // biome-ignore lint/suspicious/noExplicitAny: gifwrap types only describe (w,h,fill) overload
      const bitmap = new (BitmapImage as any)({ width: info.width, height: info.height, data })
      ;(GifUtil.quantizeDekker as (b: unknown) => void)(bitmap)
      // biome-ignore lint/suspicious/noExplicitAny: same as above
      const frame = new (GifFrame as any)(bitmap)
      const tmpFile = path.join(tmpDir, `${sha1(this.parsedUrl.original.pathname)}.gif`)
      const gif = await GifUtil.write(tmpFile, [frame])
      await fs.unlink(tmpFile).catch(() => {})
      return gif.buffer
    } catch (err) {
      logger.warn({ module: 'image', err }, 'gif encoding failed, falling back to buffer')
      return buffer
    }
  }

  private async getImageInfo(
    oldBuffer: Buffer,
    newBuffer: Buffer
  ): Promise<Record<string, unknown>> {
    const o = this.options as ImageOptions
    const data: Record<string, unknown> = {
      fileName: this.fileName,
      cacheReference: sha1(this.fileName),
      quality: o.quality ?? 75,
      trim: o.trim ?? 0,
      trimFuzz: o.trimFuzz ?? 0,
      resizeStyle: o.resizeStyle ?? 'aspectfill',
      gravity: o.gravity ?? 'Center',
      filter: o.filter ?? 'None',
      blur: o.blur ?? 0,
      strip: o.strip ?? 0,
      rotate: o.rotate ?? 0,
      flip: o.flip ?? 0,
      ratio: o.ratio ?? 0,
      devicePixelRatio: o.devicePixelRatio ?? 0,
      format: this.imageData?.format,
      fileSizePre: oldBuffer.byteLength,
      fileSizePost: newBuffer.byteLength
    }
    if (this.entropy) data.entropyCrop = this.entropy

    try {
      const { Vibrant } = await import('node-vibrant/node')
      const oldPalette = await Vibrant.from(oldBuffer).getPalette()
      const newPalette = await Vibrant.from(newBuffer).getPalette()
      type Swatch = { getHex(): string; getRgb(): [number, number, number] }
      const toSwatchList = (palette: Record<string, unknown>) =>
        Object.values(palette).filter(Boolean) as Swatch[]
      const oldS = toSwatchList(oldPalette)
      const newS = toSwatchList(newPalette)
      data.primaryColorPre = oldS[0]?.getHex()
      data.palettePre = {
        rgb: oldS.slice(1).map((s) => s.getRgb()),
        hex: oldS.slice(1).map((s) => s.getHex())
      }
      data.primaryColorPost = newS[0]?.getHex()
      data.palettePost = {
        rgb: newS.slice(1).map((s) => s.getRgb()),
        hex: newS.slice(1).map((s) => s.getHex())
      }
    } catch (err) {
      logger.warn({ module: 'image', err }, 'vibrant palette failed')
    }

    if (this.exifData.image) {
      const img = this.exifData.image as Record<string, unknown>
      if (img.XResolution && img.YResolution) {
        data.density = {
          width: img.XResolution,
          height: img.YResolution,
          unit: img.ResolutionUnit === 2 ? 'dpi' : ''
        }
      }
    }
    return data
  }

  private sanitiseOptions(options: Record<string, unknown>): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    const work = { ...options }
    for (const k of Object.keys(work)) {
      if (k.startsWith('?')) {
        work[k.slice(1)] = work[k]
        delete work[k]
      }
    }
    for (const key of Object.keys(work)) {
      const setting = IMAGE_PARAMETERS.find((s) => s.name === key || s.aliases.includes(key))
      if (!setting) continue
      let value: unknown = work[key]
      if (value === '0' && !setting.allowZero && !setting.default) continue
      if (value !== '0' || setting.allowZero) {
        if (setting.lowercase && typeof value === 'string') value = value.toLowerCase()
        const num = Number(value)
        if (!Number.isNaN(num) && typeof value !== 'boolean') value = num
        if (setting.minimumValue !== undefined && (value as number) < setting.minimumValue) {
          value = setting.minimumValue
        }
        if (setting.maximumValue !== undefined && (value as number) > setting.maximumValue) {
          value = setting.maximumValue
        }
        result[setting.name] = value
      } else if (setting.default !== undefined) {
        result[setting.name] = setting.default
      }
      delete work[key]
    }
    for (const setting of IMAGE_PARAMETERS) {
      if (setting.default !== undefined && result[setting.name] === undefined) {
        result[setting.name] = setting.default
      }
    }
    return { ...result, ...work }
  }
}
