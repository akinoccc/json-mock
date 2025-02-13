import { describe, expect, it } from 'vitest'
import Auth from '../src/auth'

describe('auth Test', () => {
  it('should generate and verify token', () => {
    const auth = new Auth({
      enabled: true,
      secret: 'test-secret',
    })

    const payload = { id: 1, username: 'test' }
    const token = auth.generateToken(payload)

    expect(token).toBeTruthy()

    const decoded = auth.verifyToken(token)
    expect(decoded).toBeTruthy()
    expect(decoded.username).toBe(payload.username)
  })

  it('should handle invalid token', () => {
    const auth = new Auth({
      enabled: true,
      secret: 'test-secret',
    })

    const result = auth.verifyToken('invalid-token')
    expect(result).toBeNull()
  })
})
