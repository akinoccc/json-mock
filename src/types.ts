import type { Request } from 'express'
import type Joi from 'joi'
import type jwt from 'jsonwebtoken'
import type { LogLevelDesc } from 'loglevel'
import type { Collection } from './db'

export type { LogLevelDesc }

export interface Config {
  port: number
  delay?: number
  prefix?: string
  dbStoragePath: string
  dbModelPath: string
  auth?: AuthConfig
  onSave?: () => Promise<void>
  logLevel?: LogLevelDesc
}

export interface AuthConfig {
  enabled: boolean
  secret: jwt.Secret
  expiresIn?: jwt.SignOptions['expiresIn']
  excludePaths?: string[]
}

export interface ValidationSchema {
  [key: string]: Joi.Schema
}

export interface AuthenticatedRequest extends Request {
  user?: {
    id: number
    username: string
    [key: string]: any
  }
}

export interface QueryParams {
  page?: number
  limit?: number
  [key: string]: any
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    total: number
    current_page: number
    per_page: number
    total_pages: number
  }
}

export interface DatabaseData {
  [key: string]: Collection
}
