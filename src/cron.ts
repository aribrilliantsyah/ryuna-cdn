import { CronJob } from 'cron'
import { cache } from './cache/index.js'
import { config } from './config/index.js'
import { domainManager } from './domain-manager.js'
import { createLogger } from './logger.js'
const logger = createLogger('Cron')

const jobs = new Map<string, CronJob>()

export function startFrequencyCache(): void {
  if (config.get<boolean>('multiDomain.enabled')) {
    for (const { domain } of domainManager.getDomains()) {
      const cronString = config.get<string | null>('caching.expireAt', domain)
      if (typeof cronString !== 'string') continue
      jobs.set(
        domain,
        new CronJob(
          cronString,
          () => {
            cache()
              .delete([domain])
              .catch((err) => logger.error({ module: 'expireAt-flush', err }))
          },
          null,
          true
        )
      )
    }
    return
  }

  const cronString = config.get<string | null>('caching.expireAt')
  if (typeof cronString !== 'string') return
  jobs.set(
    '__global',
    new CronJob(
      cronString,
      () => {
        cache()
          .delete()
          .catch((err) => logger.error({ module: 'expireAt-flush', err }))
      },
      null,
      true
    )
  )
}

export function stopFrequencyCache(): void {
  for (const job of jobs.values()) job.stop()
  jobs.clear()
}
