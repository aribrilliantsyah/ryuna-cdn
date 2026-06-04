import { config } from '../config/index.js'

type ReqLike = { headers: { host?: string; 'x-forwarded-proto'?: string | string[]; 'x-forwarded-host'?: string | string[]; 'x-forwarded-port'?: string | string[] } }

function firstHeader(v: string | string[] | undefined): string | undefined {
  if (!v) return undefined
  const s = Array.isArray(v) ? v[0] : v
  return s?.split(',')[0]?.trim()
}

function isDefaultPort(protocol: string, port: number): boolean {
  return (protocol === 'https' && port === 443) || (protocol === 'http' && port === 80)
}

export function publicUrl(req: ReqLike): string {
  const fwdProto = firstHeader(req.headers['x-forwarded-proto'])
  const fwdHostRaw = firstHeader(req.headers['x-forwarded-host'])
  const fwdPort = firstHeader(req.headers['x-forwarded-port'])

  if (fwdProto && fwdHostRaw) {
    const [fwdHost, hostPort] = fwdHostRaw.split(':')
    const portStr = fwdPort ?? hostPort
    const port = portStr ? Number(portStr) : (fwdProto === 'https' ? 443 : 80)
    const portSuffix = isDefaultPort(fwdProto, port) ? '' : `:${port}`
    return `${fwdProto}://${fwdHost}${portSuffix}`
  }

  const publicHost = config.get<string | null>('publicUrl.host')
  if (publicHost) {
    const protocol = config.get<string>('publicUrl.protocol')
    const port = config.get<number>('publicUrl.port')
    const portSuffix = isDefaultPort(protocol, port) ? '' : `:${port}`
    return `${protocol}://${publicHost}${portSuffix}`
  }

  const protocol = config.get<string>('server.protocol')
  const port = config.get<number>('server.port')
  const host = req.headers.host?.split(':')[0] ?? '127.0.0.1'
  const portSuffix = isDefaultPort(protocol, port) ? '' : `:${port}`
  return `${protocol}://${host}${portSuffix}`
}
