import { z } from 'zod'

const sectionDefault = <T extends z.ZodTypeAny>(schema: T) => schema.default({} as never)

export const cacheControlEntrySchema = z.record(z.string(), z.string())

export const configSchema = z
  .object({
    env: z.enum(['development', 'production', 'qa', 'test']).default('development'),

    server: sectionDefault(
      z
        .object({
          host: z.string().default('0.0.0.0'),
          port: z.coerce.number().int().positive().default(8080),
          redirectPort: z.coerce.number().int().min(0).default(0),
          name: z.string().default('RyunaCDN'),
          protocol: z.enum(['http', 'https']).default('http'),
          sslPassphrase: z.string().default(''),
          sslPrivateKeyPath: z.string().default(''),
          sslCertificatePath: z.string().default(''),
          sslIntermediateCertificatePath: z.string().default(''),
          sslIntermediateCertificatePaths: z.array(z.string()).default([]),
          enableHTTP2: z.boolean().default(true)
        })
        .default({})
    ),

    publicUrl: sectionDefault(
      z
        .object({
          host: z.string().nullable().default(null),
          port: z.coerce.number().default(80),
          protocol: z.enum(['http', 'https']).default('http')
        })
        .default({})
    ),

    logging: sectionDefault(
      z
        .object({
          enabled: z.boolean().default(true),
          level: z
            .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
            .default('info'),
          path: z.string().default('./log'),
          filename: z.string().default('ryunacdn'),
          extension: z.string().default('log'),
          accessLog: z.object({ enabled: z.boolean().default(true) }).default({})
        })
        .default({})
    ),

    notFound: sectionDefault(
      z
        .object({
          statusCode: z.number().default(404),
          images: z
            .object({
              enabled: z.boolean().default(false),
              path: z.string().default('./images/missing.png')
            })
            .default({})
        })
        .default({})
    ),

    images: sectionDefault(
      z
        .object({
          directory: z
            .object({
              enabled: z.boolean().default(true),
              path: z.string().default('./storage/images')
            })
            .default({}),
          s3: z
            .object({
              enabled: z.boolean().default(false),
              accessKey: z.string().default(''),
              secretKey: z.string().default(''),
              bucketName: z.string().default(''),
              region: z.string().default(''),
              endpoint: z.string().default('')
            })
            .default({}),
          remote: z
            .object({
              enabled: z.boolean().default(false),
              path: z.string().default(''),
              allowFullURL: z.boolean().default(true)
            })
            .default({})
        })
        .default({})
    ),

    assets: sectionDefault(
      z
        .object({
          directory: z
            .object({
              enabled: z.boolean().default(true),
              path: z.string().default('./storage/assets')
            })
            .default({}),
          s3: z
            .object({
              enabled: z.boolean().default(false),
              accessKey: z.string().default(''),
              secretKey: z.string().default(''),
              bucketName: z.string().default(''),
              region: z.string().default(''),
              endpoint: z.string().default('')
            })
            .default({}),
          remote: z
            .object({
              enabled: z.boolean().default(false),
              path: z.string().default(''),
              allowFullURL: z.boolean().default(true)
            })
            .default({})
        })
        .default({})
    ),

    caching: sectionDefault(
      z
        .object({
          expireAt: z.string().nullable().default(null),
          ttl: z.number().default(3600),
          cache404: z.boolean().default(true),
          directory: z
            .object({
              enabled: z.boolean().default(true),
              path: z.string().default('./cache/')
            })
            .default({}),
          redis: z
            .object({
              enabled: z.boolean().default(false),
              host: z.string().default('127.0.0.1'),
              port: z.coerce.number().default(6379),
              password: z.string().default('')
            })
            .default({})
        })
        .default({})
    ),

    status: sectionDefault(
      z
        .object({
          enabled: z.boolean().default(true),
          requireAuthentication: z.boolean().default(true),
          standalone: z.boolean().default(false),
          port: z.coerce.number().default(8003),
          routes: z
            .array(
              z.object({
                route: z.string(),
                expectedResponseTime: z.number()
              })
            )
            .default([])
        })
        .default({})
    ),

    security: sectionDefault(
      z
        .object({
          maxWidth: z.number().default(2048),
          maxHeight: z.number().default(2048)
        })
        .default({})
    ),

    auth: sectionDefault(
      z
        .object({
          tokenUrl: z.string().default('/token'),
          clientId: z.string().nullable().default(null),
          secret: z.string().nullable().default(null),
          tokenTtl: z.number().default(1800),
          privateKey: z.string().nullable().default(null)
        })
        .default({})
    ),

    cloudfront: sectionDefault(
      z
        .object({
          enabled: z.boolean().default(false),
          accessKey: z.string().default(''),
          secretKey: z.string().default(''),
          region: z.string().default('us-east-1'),
          distribution: z.string().default('')
        })
        .default({})
    ),

    cluster: z.boolean().default(false),

    paths: sectionDefault(
      z
        .object({
          plugins: z.string().default('workspace/plugins'),
          recipes: z.string().default('workspace/recipes'),
          routes: z.string().default('workspace/routes')
        })
        .default({})
    ),

    headers: sectionDefault(
      z
        .object({
          useGzipCompression: z.boolean().default(true),
          cacheControl: z
            .object({
              default: z.string().default('public, max-age=3600'),
              paths: z.array(cacheControlEntrySchema).default([]),
              mimetypes: z
                .array(cacheControlEntrySchema)
                .default([
                  { 'text/css': 'public, max-age=86400' },
                  { 'text/javascript': 'public, max-age=86400' },
                  { 'application/javascript': 'public, max-age=86400' }
                ])
            })
            .default({})
        })
        .default({})
    ),

    robots: z.string().default(''),

    geolocation: sectionDefault(
      z
        .object({
          enabled: z.boolean().default(false),
          method: z.enum(['maxmind', 'remote']).default('maxmind'),
          maxmind: z
            .object({
              countryDbPath: z.string().default('./vendor/maxmind-country.mmdb')
            })
            .default({}),
          remote: z
            .object({
              url: z.string().default(''),
              key: z.string().default(''),
              secret: z.string().default(''),
              countryPath: z.string().default('location.country.isoCode')
            })
            .default({})
        })
        .default({})
    ),

    network: sectionDefault(
      z
        .object({
          url: z.string().default(''),
          key: z.string().default(''),
          secret: z.string().default(''),
          path: z.string().default('speed.connectionType')
        })
        .default({})
    ),

    engines: sectionDefault(
      z
        .object({
          sharp: z
            .object({
              kernel: z
                .enum(['nearest', 'cubic', 'mitchell', 'lanczos2', 'lanczos3'])
                .default('lanczos3')
            })
            .default({})
        })
        .default({})
    ),

    experimental: sectionDefault(
      z
        .object({
          jsTranspiling: z.boolean().default(false)
        })
        .default({})
    ),

    multiDomain: sectionDefault(
      z
        .object({
          enabled: z.boolean().default(false),
          directory: z.string().default('domains'),
          configurationApi: z.boolean().default(false)
        })
        .default({})
    ),

    http: sectionDefault(
      z
        .object({
          followRedirects: z.number().default(10)
        })
        .default({})
    ),

    defaultFiles: z.array(z.string()).default([])
  })
  .default({} as never)

export type AppConfig = z.infer<typeof configSchema>

const PER_DOMAIN_PATHS = new Set<string>([
  'notFound.statusCode',
  'notFound.images.enabled',
  'notFound.images.path',
  'images.directory.enabled',
  'images.directory.path',
  'images.remote.enabled',
  'images.remote.path',
  'images.remote.allowFullURL',
  'assets.directory.enabled',
  'assets.directory.path',
  'assets.remote.enabled',
  'assets.remote.path',
  'assets.remote.allowFullURL',
  'caching.expireAt',
  'caching.ttl',
  'caching.cache404',
  'auth.clientId',
  'auth.secret',
  'auth.tokenTtl',
  'auth.privateKey',
  'paths.plugins',
  'paths.recipes',
  'paths.routes',
  'headers.useGzipCompression',
  'headers.cacheControl',
  'experimental.jsTranspiling',
  'http.followRedirects'
])

export function canOverrideAtDomain(path: string): boolean {
  return PER_DOMAIN_PATHS.has(path)
}
