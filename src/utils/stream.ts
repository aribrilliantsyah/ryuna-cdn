import { Readable } from 'node:stream'

export async function streamToBuffer(input: Readable | Buffer): Promise<Buffer> {
  if (Buffer.isBuffer(input)) return input
  const chunks: Buffer[] = []
  for await (const chunk of input) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  return Buffer.concat(chunks)
}

export function bufferToStream(buf: Buffer): Readable {
  return Readable.from(buf)
}
