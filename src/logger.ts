import { pino, type Logger as PinoLogger } from 'pino'
import { config } from './config/index.js'

const isDev = config.get<string>('env') === 'development'

const baseOptions = {
  level: config.get<string>('logging.level') ?? 'info',
  enabled: config.get<boolean>('logging.enabled') ?? true,
  base: undefined,
  formatters: {
    level(label: string) {
      return { level: label }
    }
  }
}

export const rootLogger: PinoLogger = pino({
  ...baseOptions,
  ...(isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'yyyy-mm-dd HH:MM:ss.l',
            ignore: 'pid,hostname,class',
            messageFormat: '{if class}[{class}] {end}{msg}',
            singleLine: false,
            errorLikeObjectKeys: ['err', 'error']
          }
        }
      }
    : {})
})

export function createLogger(className: string): PinoLogger {
  return rootLogger.child({ class: className })
}

export const logger = createLogger('App')
export type Logger = PinoLogger
