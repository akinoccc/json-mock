import { ModelScanner } from './ModelScanner'

export function Model(options: { name?: string } = {}) {
  return function (target: any) {
    const tableName = options.name || ModelScanner.classNameToTableName(target.name)
    Reflect.defineMetadata('model:name', tableName, target)
  }
}

export function Field(options: FieldOptions = {}) {
  return function (target: any, propertyKey: string) {
    const fields = Reflect.getMetadata('model:fields', target.constructor) || {}
    fields[propertyKey] = {
      type: Reflect.getMetadata('design:type', target, propertyKey),
      ...options,
    }
    Reflect.defineMetadata('model:fields', fields, target.constructor)
  }
}

export function AutoIncrement() {
  return function (target: any, propertyKey: string) {
    const fields = Reflect.getMetadata('model:fields', target.constructor) || {}
    fields[propertyKey] = {
      ...fields[propertyKey],
      autoIncrement: true,
    }
    Reflect.defineMetadata('model:fields', fields, target.constructor)
  }
}

export interface FieldOptions {
  type?: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object'
  required?: boolean
  default?: any
  min?: number
  max?: number
  enum?: any[]
  unique?: boolean
  index?: boolean
  ref?: string
  filterable?: boolean
}
