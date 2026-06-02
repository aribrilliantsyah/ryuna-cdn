import path from 'node:path'

const RESERVED_WIN = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\..*)?$/i
const NULL_BYTE = /\x00/

/**
 * Resolve `userPath` against `base` and reject anything that escapes the base.
 * Strict mode:
 *   - absolute paths rejected (no leading `/` or `\`)
 *   - `..` segments rejected
 *   - null bytes rejected
 *   - Windows reserved names rejected
 *   - path length capped at 255 chars
 */
export function safeJoin(base: string, userPath: string | null | undefined): string {
  const root = path.resolve(base)
  if (!userPath) return root

  if (NULL_BYTE.test(userPath)) {
    throw Object.assign(new Error('null byte in path'), { statusCode: 400 })
  }
  if (userPath.length > 255) {
    throw Object.assign(new Error('path too long (max 255)'), { statusCode: 400 })
  }
  if (path.isAbsolute(userPath) || userPath.startsWith('/') || userPath.startsWith('\\')) {
    throw Object.assign(new Error('absolute path not allowed'), { statusCode: 400 })
  }

  const segments = userPath.split(/[/\\]+/).filter(Boolean)
  for (const seg of segments) {
    if (seg === '..' || seg === '.') {
      throw Object.assign(new Error("'.' or '..' segment not allowed"), { statusCode: 400 })
    }
    if (RESERVED_WIN.test(seg)) {
      throw Object.assign(new Error(`reserved name '${seg}' not allowed`), { statusCode: 400 })
    }
  }

  const resolved = path.resolve(root, segments.join(path.sep))
  const rootWithSep = root.endsWith(path.sep) ? root : root + path.sep
  if (resolved !== root && !resolved.startsWith(rootWithSep)) {
    throw Object.assign(new Error('path traversal detected'), { statusCode: 400 })
  }
  return resolved
}
