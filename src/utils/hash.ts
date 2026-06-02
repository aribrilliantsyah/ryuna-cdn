import { createHash } from 'node:crypto'

export function sha1(input: string): string {
  return createHash('sha1').update(input).digest('hex')
}

export function cacheKey(parts: Array<string | number | null | undefined>): string {
  return parts.reduce<string>((acc, node) => {
    if (node || node === 0) acc += sha1(String(node))
    return acc
  }, '')
}
