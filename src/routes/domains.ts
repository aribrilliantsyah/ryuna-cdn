import type { FastifyInstance } from 'fastify'
import { config } from '../config/index.js'
import { domainManager } from '../domain-manager.js'

interface DomainAddItem {
  domain: string
  data: unknown
}

export function domainRoutes(app: FastifyInstance): void {
  app.addHook('onRequest', async (req, reply) => {
    if (!req.url.startsWith('/_ryunacdn/domains')) return
    if (!config.get<boolean>('multiDomain.configurationApi') || !config.get<boolean>('multiDomain.enabled')) {
      return reply.callNotFound()
    }
  })

  app.post('/_ryunacdn/domains', async (req, reply) => {
    if (!Array.isArray(req.body) || req.body.length === 0) {
      return reply.code(400).send({ success: false, errors: ['Bad Request'] })
    }
    const items = req.body as DomainAddItem[]
    for (const item of items) {
      if (!domainManager.getDomain(item.domain)) {
        domainManager.addDomain(item.domain, item.data)
      }
    }
    return reply.code(201).send({
      success: true,
      domains: domainManager.getDomains().map((d) => d.domain)
    })
  })

  app.put('/_ryunacdn/domains/:domain', async (req, reply) => {
    const body = req.body as { data?: unknown } | undefined
    const domain = (req.params as { domain?: string }).domain
    if (!body?.data || !domain) {
      return reply.code(400).send({ success: false, errors: ['Bad Request'] })
    }
    if (!domainManager.getDomain(domain)) {
      return reply.code(404).send({ success: false, errors: [`Domain '${domain}' does not exist`] })
    }
    domainManager.addDomain(domain, body.data)
    return reply.code(200).send({
      success: true,
      domains: domainManager.getDomains().map((d) => d.domain)
    })
  })

  app.delete('/_ryunacdn/domains/:domain', async (req, reply) => {
    const domain = (req.params as { domain?: string }).domain
    if (!domain) return reply.code(400).send({ success: false, errors: ['Bad Request'] })
    if (!domainManager.getDomain(domain)) {
      return reply.code(404).send({ success: false, errors: [`Domain '${domain}' does not exist`] })
    }
    domainManager.removeDomain(domain)
    return reply.code(200).send({
      success: true,
      domains: domainManager.getDomains().map((d) => d.domain)
    })
  })
}
