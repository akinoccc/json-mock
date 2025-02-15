export interface ValidationRule {
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date'
  required?: boolean
  min?: number
  max?: number
  pattern?: RegExp
  enum?: any[]
  custom?: (value: any) => boolean | string
}

export interface SchemaDefinition {
  [key: string]: ValidationRule
}

export class Validator {
  private schema: SchemaDefinition

  constructor(schema: SchemaDefinition) {
    this.schema = schema
  }

  validate(data: any): { isValid: boolean, errors: string[] } {
    const errors: string[] = []

    for (const [field, rules] of Object.entries(this.schema)) {
      const value = data[field]

      // 检查必填字段
      if (rules.required && (value === undefined || value === null)) {
        errors.push(`字段 ${field} 是必填的`)
        continue
      }

      // 如果字段不存在且不是必填，跳过后续验证
      if (value === undefined || value === null) {
        continue
      }

      // 类型检查
      if (rules.type) {
        const typeError = this.validateType(field, value, rules.type)
        if (typeError)
          errors.push(typeError)
      }

      // 数值范围检查
      if ((rules.min !== undefined || rules.max !== undefined)
        && (rules.type === 'number' || rules.type === 'string' || rules.type === 'array')) {
        const rangeError = this.validateRange(field, value, rules)
        if (rangeError)
          errors.push(rangeError)
      }

      // 正则表达式检查
      if (rules.pattern && typeof value === 'string') {
        if (!rules.pattern.test(value)) {
          errors.push(`字段 ${field} 不匹配指定的格式`)
        }
      }

      // 枚举值检查
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`字段 ${field} 的值必须是以下之一: ${rules.enum.join(', ')}`)
      }

      // 自定义验证
      if (rules.custom) {
        const customResult = rules.custom(value)
        if (typeof customResult === 'string') {
          errors.push(customResult)
        }
        else if (!customResult) {
          errors.push(`字段 ${field} 未通过自定义验证`)
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    }
  }

  private validateType(field: string, value: any, type: string): string | null {
    switch (type) {
      case 'string':
        if (typeof value !== 'string')
          return `字段 ${field} 必须是字符串类型`
        break
      case 'number':
        if (typeof value !== 'number')
          return `字段 ${field} 必须是数字类型`
        break
      case 'boolean':
        if (typeof value !== 'boolean')
          return `字段 ${field} 必须是布尔类型`
        break
      case 'array':
        if (!Array.isArray(value))
          return `字段 ${field} 必须是数组类型`
        break
      case 'object':
        if (typeof value !== 'object' || Array.isArray(value) || value === null)
          return `字段 ${field} 必须是对象类型`
        break
      case 'date':
        if (!(value instanceof Date) && Number.isNaN(Date.parse(value)))
          return `字段 ${field} 必须是有效的日期`
        break
    }
    return null
  }

  private validateRange(field: string, value: any, rules: ValidationRule): string | null {
    const { min, max } = rules

    if (rules.type === 'number') {
      if (min !== undefined && value < min)
        return `字段 ${field} 不能小于 ${min}`
      if (max !== undefined && value > max)
        return `字段 ${field} 不能大于 ${max}`
    }
    else if (rules.type === 'string' || rules.type === 'array') {
      const length = value.length
      if (min !== undefined && length < min)
        return `字段 ${field} 的长度不能小于 ${min}`
      if (max !== undefined && length > max)
        return `字段 ${field} 的长度不能大于 ${max}`
    }

    return null
  }
}
