import type { NextFunction, Request, Response } from 'express'
import type { AuthConfig, AuthenticatedRequest } from './types'
import jwt from 'jsonwebtoken'

class Auth {
  private secret: jwt.Secret
  private expiresIn: jwt.SignOptions['expiresIn']
  private excludePaths: Set<string>

  constructor(options: AuthConfig = {
    enabled: false,
    secret: '',
  }) {
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
    catch (error) {
      console.error(error)
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
