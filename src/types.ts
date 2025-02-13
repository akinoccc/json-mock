import type { Request } from 'express'
import type Joi from 'joi'
import type jwt from 'jsonwebtoken'

export interface Config {
  port: number
  delay?: number
  prefix?: string
  dbPath?: string
  apiPath?: string
  auth?: AuthConfig
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
