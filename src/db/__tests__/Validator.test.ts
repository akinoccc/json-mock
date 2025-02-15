import { describe, expect, it } from 'vitest'
import { Validator } from '../Validator'

describe('validator', () => {
  it('应该验证必填字段', () => {
    const validator = new Validator({
      name: { type: 'string', required: true },
    })

    const result = validator.validate({})
    expect(result.isValid).toBe(false)
    expect(result.errors[0]).toContain('必填')
  })

  it('应该验证字段类型', () => {
    const validator = new Validator({
      age: { type: 'number' },
      name: { type: 'string' },
      active: { type: 'boolean' },
      tags: { type: 'array' },
      profile: { type: 'object' },
      birthday: { type: 'date' },
    })

    const result = validator.validate({
      age: '25', // 错误类型
      name: 123, // 错误类型
      active: 1, // 错误类型
      tags: {}, // 错误类型
      profile: [], // 错误类型
      birthday: 'invalid-date', // 错误类型
    })

    expect(result.isValid).toBe(false)
    expect(result.errors).toHaveLength(6)
  })

  it('应该验证数值范围', () => {
    const validator = new Validator({
      age: { type: 'number', min: 0, max: 150 },
      name: { type: 'string', min: 2, max: 50 },
      tags: { type: 'array', min: 1, max: 5 },
    })

    const result = validator.validate({
      age: 200, // 超出范围
      name: 'a', // 太短
      tags: ['1', '2', '3', '4', '5', '6'], // 数组太长
    })

    expect(result.isValid).toBe(false)
    expect(result.errors).toHaveLength(3)
  })

  it('应该验证正则表达式', () => {
    const validator = new Validator({
      email: { type: 'string', pattern: /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/ },
    })

    const result = validator.validate({
      email: 'invalid-email',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors[0]).toContain('格式')
  })

  it('应该验证枚举值', () => {
    const validator = new Validator({
      role: { type: 'string', enum: ['user', 'admin'] },
    })

    const result = validator.validate({
      role: 'guest',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors[0]).toContain('之一')
  })

  it('应该支持自定义验证', () => {
    const validator = new Validator({
      password: {
        type: 'string',
        custom: (value) => {
          if (value.length < 6)
            return '密码太短'
          return true
        },
      },
    })

    const result = validator.validate({
      password: '123',
    })

    expect(result.isValid).toBe(false)
    expect(result.errors[0]).toBe('密码太短')
  })
})
