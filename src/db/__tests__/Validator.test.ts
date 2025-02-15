import { describe, expect, it } from 'vitest'
import { Validator } from '../Validator'

describe('validator', () => {
  it('should validate required fields', () => {
    const validator = new Validator({
      name: { type: 'string', required: true },
    })

    const result = validator.validate({})
    expect(result.isValid).toBe(false)
    expect(result.errors[0]).toContain('required')
  })

  it('should validate field types', () => {
    const validator = new Validator({
      age: { type: 'number' },
      name: { type: 'string' },
      active: { type: 'boolean' },
      tags: { type: 'array' },
      profile: { type: 'object' },
      birthday: { type: 'date' },
    })

    const result = validator.validate({
      age: '25', // wrong type
      name: 123, // wrong type
      active: 1, // wrong type
      tags: {}, // wrong type
      profile: [], // wrong type
      birthday: 'invalid-date', // wrong type
    })

    expect(result.isValid).toBe(false)
    expect(result.errors).toHaveLength(6)
  })

  it('should validate numeric range', () => {
    const validator = new Validator({
      age: { type: 'number', min: 0, max: 150 },
      name: { type: 'string', min: 2, max: 50 },
      tags: { type: 'array', min: 1, max: 5 },
    })

    const result = validator.validate({
      age: 200, // out of range
      name: 'a', // too short
      tags: ['1', '2', '3', '4', '5', '6'], // array too long
    })

    expect(result.isValid).toBe(false)
    expect(result.errors).toHaveLength(3)
  })

  it('should validate regex', () => {
    const validator = new Validator({
      email: { type: 'string', pattern: /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/ },
    })

    const result = validator.validate({
      email: 'invalid-email',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors[0]).toContain('format')
  })

  it('should validate enum values', () => {
    const validator = new Validator({
      role: { type: 'string', enum: ['user', 'admin'] },
    })

    const result = validator.validate({
      role: 'guest',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors[0]).toContain('one of')
  })

  it('should support custom validation', () => {
    const validator = new Validator({
      password: {
        type: 'string',
        custom: (value) => {
          if (value.length < 6)
            return 'password is too short'
          return true
        },
      },
    })

    const result = validator.validate({
      password: '123',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors[0]).toBe('password is too short')
  })
})
