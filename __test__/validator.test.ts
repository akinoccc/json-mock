import Joi from 'joi'
import { describe, expect, it } from 'vitest'
import Validator from '../src/validator'

describe('validator test', () => {
  it('should add and validate schema', () => {
    const validator = new Validator()

    const userSchema = {
      username: Joi.string().required(),
      email: Joi.string().email().required(),
    }

    validator.addSchema('users', userSchema)

    const validData = {
      username: 'test',
      email: 'test@example.com',
    }

    const { error: validError } = validator.validate('users', validData)
    expect(validError).toBeUndefined()

    const invalidData = {
      username: 'test',
      email: 'invalid-email',
    }

    const { error: invalidError } = validator.validate('users', invalidData)
    expect(invalidError).toBeTruthy()
  })
})
