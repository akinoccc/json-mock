import type { ObjectSchema } from 'joi'
import type { ValidationSchema } from './types'
import Joi from 'joi'

class Validator {
  private schemas: Map<string, ObjectSchema>

  constructor() {
    this.schemas = new Map()
  }

  public addSchema(resource: string, schema: ValidationSchema): this {
    this.schemas.set(resource, Joi.object(schema))
    return this
  }

  public getSchema(resource: string): ObjectSchema | undefined {
    return this.schemas.get(resource)
  }

  public validate(resource: string, data: any): Joi.ValidationResult {
    const schema = this.getSchema(resource)
    if (!schema) {
      return { error: undefined, value: data }
    }
    return schema.validate(data, { abortEarly: false })
  }
}

export default Validator
