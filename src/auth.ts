import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import jwt from 'jsonwebtoken'
import { config } from './config/index.js'
import { createLogger } from './logger.js'
const logger = createLogger('Auth')

function unauthorized(reply: FastifyReply, type: 'NoToken' | 'InvalidToken' | 'NoPrivateKey' | 'NoAccess' | 'JWTError'): void {
  const challenges: Record<typeof type, string> = {
    NoToken: 'Bearer, error="no_token", error_description="No access token supplied"',
    InvalidToken: 'Bearer, error="invalid_token", error_description="Invalid or expired access token"',
    NoPrivateKey: 'Bearer, error="no_private_key", error_description="No private key configured"',
    NoAccess: 'Bearer realm="/token"',
    JWTError: 'Bearer realm="/token"'
  }
  reply
    .header('WWW-Authenticate', challenges[type])
    .header('Cache-Control', 'private, no-cache, no-store, must-revalidate')
    .header('Pragma', 'no-cache')
    .header('Expires', '-1')
    .code(401)
    .send({ Error: 'HTTP 401 Unauthorized' })
}

function mustAuthenticate(url: string): boolean {
  if (url.startsWith('/_ryunacdn')) return false
  return url.startsWith('/api')
}

export function registerAuth(app: FastifyInstance): void {
  const tokenUrl = config.get<string>('auth.tokenUrl') ?? '/token'

  app.post(tokenUrl, async (req, reply) => {
    const body = (req.body ?? {}) as { clientId?: string; secret?: string }
    const clientId = body.clientId
    const secret = body.secret
    const domain = req.ctx?.domain

    if (!clientId || !secret) return unauthorized(reply, 'NoAccess')
    if (!config.get<string>('auth.privateKey', domain)) return unauthorized(reply, 'NoPrivateKey')

    if (
      clientId !== config.get<string>('auth.clientId', domain) ||
      secret !== config.get<string>('auth.secret', domain)
    ) {
      return unauthorized(reply, 'NoAccess')
    }

    try {
      const token = jwt.sign(
        { domain },
        config.get<string>('auth.privateKey', domain),
        { expiresIn: config.get<number>('auth.tokenTtl', domain) }
      )
      reply.header('Cache-Control', 'no-store').header('Pragma', 'no-cache')
      return {
        accessToken: token,
        tokenType: 'Bearer',
        expiresIn: config.get<number>('auth.tokenTtl', domain)
      }
    } catch (err) {
      logger.error({ module: 'auth', err }, 'jwt sign failed')
      return unauthorized(reply, 'JWTError')
    }
  })

  app.addHook('onRequest', async (req: FastifyRequest, reply: FastifyReply) => {
    if (req.url === tokenUrl || !mustAuthenticate(req.url)) return

    const header = req.headers.authorization
    if (!header) return unauthorized(reply, 'NoToken')
    const parts = header.split(' ')
    const token = parts.length === 2 && /^Bearer$/i.test(parts[0] ?? '') ? parts[1] : null
    if (!token) return unauthorized(reply, 'NoToken')

    try {
      const privateKey = config.get<string>('auth.privateKey', req.ctx?.domain)
      if (!privateKey) return unauthorized(reply, 'NoPrivateKey')
      const decoded = jwt.verify(token, privateKey) as { domain?: string }
      if (decoded.domain !== req.ctx?.domain) return unauthorized(reply, 'InvalidToken')
    } catch {
      return unauthorized(reply, 'InvalidToken')
    }
  })
}
