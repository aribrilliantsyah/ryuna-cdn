import type { FastifyRequest } from 'fastify'

export interface RequestContext {
  domain?: string
}

declare module 'fastify' {
  interface FastifyRequest {
    ctx?: RequestContext
  }
}

export interface StorageAdapter {
  url: string
  providerType?: string
  lastModified?: Date
  notFound?: boolean
  getFullUrl(): string
  getLastModified(): Date | undefined
  get(): Promise<Buffer>
}

export interface Handler {
  isCached?: boolean
  storageHandler: StorageAdapter | null
  get(): Promise<Buffer>
  getContentType(): string
  getFilename?(): string
  getLastModified?(): Date | undefined
  getHeader?(name: string): string | undefined
  setBaseUrl?(url: string): void
}

export interface RecipeFile {
  recipe: string
  settings: Record<string, unknown> & { format?: string }
  path?: string
  plugins?: string[]
}

export interface RouteBranchCondition {
  device?: string | string[]
  language?: string | string[]
  languageMinQuality?: number
  country?: string | string[]
  network?: string | string[]
}

export interface RouteBranch {
  recipe: string
  condition?: RouteBranchCondition
}

export interface RouteFile {
  route: string
  branches: RouteBranch[]
}

export type WorkspaceType = 'plugins' | 'recipes' | 'routes'

export interface WorkspaceEntry {
  domain?: string
  path: string
  source?: RecipeFile | RouteFile
  type: WorkspaceType
}

export type WorkspaceMap = Record<string, WorkspaceEntry>

export type FRequest = FastifyRequest
