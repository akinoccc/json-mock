import type { Collection } from './Collection'
import type { JsonDB } from './JsonDB'
import type { SchemaDefinition, ValidationRule } from './Validator'
import 'reflect-metadata'

export class ModelManager {
  private db: JsonDB
  private models: Map<string, ModelDefinition>

  constructor(db: JsonDB) {
    this.db = db
    this.models = new Map()
  }

  register(modelClass: any) {
    const modelName = Reflect.getMetadata('model:name', modelClass)
    const fields = Reflect.getMetadata('model:fields', modelClass) || {}

    if (!modelName)
      throw new Error(`模型 ${modelClass.name} 未使用 @Model 装饰器`)

    const schema = this.convertFieldsToSchema(fields)
    const collection = this.db.collection(modelName)
    collection.setValidator(schema)

    this.models.set(modelName, {
      name: modelName,
      fields,
      collection,
      modelClass,
    })

    return collection
  }

  getModel(name: string): Collection {
    const model = this.models.get(name)
    if (!model)
      throw new Error(`模型 ${name} 未注册`)
    return model.collection
  }

  private convertFieldsToSchema(fields: Record<string, any>): SchemaDefinition {
    const schema: SchemaDefinition = {}

    for (const [field, options] of Object.entries(fields)) {
      schema[field] = {
        type: this.getFieldType(options.type),
        required: options.required,
        min: options.min,
        max: options.max,
        enum: options.enum,
        custom: options.custom,
      }
    }

    return schema
  }

  private getFieldType(type: any): ValidationRule['type'] {
    if (typeof type === 'string')
      return type as ValidationRule['type']

    switch (type) {
      case String:
        return 'string'
      case Number:
        return 'number'
      case Boolean:
        return 'boolean'
      case Date:
        return 'date'
      case Array:
        return 'array'
      default:
        return 'object'
    }
  }
}

interface ModelDefinition {
  name: string
  fields: Record<string, any>
  collection: Collection
  modelClass: any
}
