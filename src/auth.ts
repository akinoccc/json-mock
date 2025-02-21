import type { NextFunction, Request, Response } from 'express'
import type log from 'loglevel'
import type { AuthConfig, AuthenticatedRequest } from './types'
import chalk from 'chalk'
import jwt from 'jsonwebtoken'
import { createLogger } from './logger'

class Auth {
  private secret: jwt.Secret
  private expiresIn: jwt.SignOptions['expiresIn']
  private excludePaths: Set<string>
  private logger: log.Logger

  constructor(options: AuthConfig = {
    enabled: false,
    secret: '',
  }) {
    this.logger = createLogger('Auth')
    this.secret = options.secret
    this.expiresIn = options.expiresIn || '1h'
    this.excludePaths = new Set(options.excludePaths || [])
  }

  public generateToken(payload: object): string {
    return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn })
  }

  public verifyToken(token: string): any {
    try {
      return jwt.verify(token, this.secret)
    }
    catch (error: any) {
      this.logger.error(chalk`{red ▶ JWT验证失败!} {gray 错误类型:} {white ${error.name}} {gray 详情:} {white ${error.message}}`)
      return null
    }
  }

  public middleware() {
    return (req: Request, res: Response, next: NextFunction): void => {
      if (this.excludePaths.has(req.path)) {
        return next()
      }

      const token = req.headers.authorization?.split(' ')[1]
      if (!token) {
        res.status(401).json({ error: 'No token provided' })
        return
      }

      const decoded = this.verifyToken(token)
      if (!decoded) {
        res.status(401).json({ error: 'Invalid token' })
        return
      }

      (req as AuthenticatedRequest).user = decoded
      next()
    }
  }
}

export default Auth
