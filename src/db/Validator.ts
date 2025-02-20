export interface ValidationRule {
  type?: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'date'
  required?: boolean
  min?: number
  max?: number
  pattern?: RegExp
  enum?: any[]
  custom?: (value: any) => boolean | string
  filterable?: boolean
}

export interface SchemaDefinition {
  [key: string]: ValidationRule
}

export class Validator {
  private schema: SchemaDefinition

  constructor(schema: SchemaDefinition) {
    this.schema = schema
  }

  getSchema(): SchemaDefinition {
    return this.schema
  }

  validate(data: any): { isValid: boolean, errors: string[] } {
    const errors: string[] = []

    for (const [field, rules] of Object.entries(this.schema)) {
      const value = data[field]

      // check required field
      if (rules.required && (value === undefined || value === null)) {
        errors.push(`the field \`${field}\` is required`)
        continue
      }

      // if the field is not exist and not required, skip the validation
      if (value === undefined || value === null) {
        continue
      }

      // type check
      if (rules.type) {
        const typeError = this.validateType(field, value, rules.type)
        if (typeError)
          errors.push(typeError)
      }

      // number range check
      if ((rules.min !== undefined || rules.max !== undefined)
        && (rules.type === 'number' || rules.type === 'string' || rules.type === 'array')) {
        const rangeError = this.validateRange(field, value, rules)
        if (rangeError)
          errors.push(rangeError)
      }

      // regex check
      if (rules.pattern && typeof value === 'string') {
        if (!rules.pattern.test(value)) {
          errors.push(`the field \`${field}\` does not match the specified format`)
        }
      }

      // enum check
      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`the field \`${field}\` must be one of the following: ${rules.enum.join(', ')}`)
      }

      // custom check
      if (rules.custom) {
        const customResult = rules.custom(value)
        if (typeof customResult === 'string') {
          errors.push(customResult)
        }
        else if (!customResult) {
          errors.push(`the field \`${field}\` does not pass the custom validation`)
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
          return `the field \`${field}\` must be a string`
        break
      case 'number':
        if (typeof value !== 'number')
          return `the field \`${field}\` must be a number`
        break
      case 'boolean':
        if (typeof value !== 'boolean')
          return `the field \`${field}\` must be a boolean`
        break
      case 'array':
        if (!Array.isArray(value))
          return `the field \`${field}\` must be an array`
        break
      case 'object':
        if (typeof value !== 'object' || Array.isArray(value) || value === null)
          return `the field \`${field}\` must be an object`
        break
      case 'date':
        if (!(value instanceof Date) && Number.isNaN(Date.parse(value)))
          return `the field \`${field}\` must be a valid date`
        break
    }
    return null
  }

  private validateRange(field: string, value: any, rules: ValidationRule): string | null {
    const { min, max } = rules

    if (rules.type === 'number') {
      if (min !== undefined && value < min)
        return `the field \`${field}\` must be greater than ${min}`
      if (max !== undefined && value > max)
        return `the field \`${field}\` must be less than ${max}`
    }
    else if (rules.type === 'string' || rules.type === 'array') {
      const length = value.length
      if (min !== undefined && length < min)
        return `the field \`${field}\` length must be greater than ${min}`
      if (max !== undefined && length > max)
        return `the field \`${field}\` length must be less than ${max}`
    }

    return null
  }
}
