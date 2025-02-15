import type { SchemaDefinition } from './Validator'
import { Validator } from './Validator'

interface QueryOperator {
  field: string
  operator: string
  value: any
}

type ComparisonOperator =
  | '='
  | '!='
  | '>'
  | '>='
  | '<'
  | '<='
  | 'in'
  | 'not-in'
  | 'contains'
  | 'starts-with'
  | 'ends-with'
  | 'exists'
  | 'between'
  | 'is empty'
  | 'is not empty'

export class Collection {
  private data: any[]
  private queryChain: QueryOperator[]
  private saveCallback: () => void
  private validator?: Validator

  constructor(data: any[], saveCallback: () => void) {
    this.data = data
    this.queryChain = []
    this.saveCallback = saveCallback
  }

  where(field: string, operator: ComparisonOperator, value?: any) {
    this.queryChain.push({ field, operator, value })
    return this
  }

  find() {
    return this.executeQuery()
  }

  findOne() {
    const results = this.executeQuery()
    return results[0] || null
  }

  findById(id: string | number) {
    this.queryChain.push({ field: 'id', operator: '=', value: id })
    const results = this.executeQuery()
    return results[0] || null
  }

  insert(doc: any) {
    const validation = this.validateDocument(doc)
    if (!validation.isValid) {
      throw new Error(`validation failed: ${validation.errors.join(', ')}`)
    }

    const newDoc = { id: this.generateId(), ...doc }
    this.data.push(newDoc)
    this.saveCallback()
    return newDoc
  }

  updateMany(updateData: any) {
    // update should not be validated
    // const validation = this.validateDocument(updateData)
    // if (!validation.isValid) {
    //   throw new Error(`validation failed: ${validation.errors.join(', ')}`)
    // }

    const toUpdate = this.executeQuery()
    toUpdate.forEach((item) => {
      Object.assign(item, updateData)
    })
    this.saveCallback()
    return toUpdate
  }

  updateById(id: string | number, updateData: any) {
    const toUpdate = this.findById(id)
    if (!toUpdate) {
      throw new Error('Not found')
    }
    return this.updateMany(updateData)?.[0]
  }

  delete() {
    const toDelete = this.executeQuery()
    toDelete.forEach((item) => {
      const index = this.data.indexOf(item)
      if (index > -1) {
        this.data.splice(index, 1)
      }
    })
    this.saveCallback()
    return toDelete
  }

  insertMany(docs: any[]) {
    for (const doc of docs) {
      const validation = this.validateDocument(doc)
      if (!validation.isValid) {
        throw new Error(`validation failed: ${validation.errors.join(', ')}`)
      }
    }

    const docsWithIds = docs.map(doc => ({
      id: this.generateId(),
      ...doc,
    }))
    this.data.push(...docsWithIds)
    this.saveCallback()
    return docsWithIds
  }

  save(doc: any) {
    const validation = this.validateDocument(doc)
    if (!validation.isValid) {
      throw new Error(`validation failed: ${validation.errors.join(', ')}`)
    }

    if (doc.id) {
      const index = this.data.findIndex(item => item.id === doc.id)
      if (index > -1) {
        this.data[index] = { ...doc }
      }
      else {
        this.data.push({ ...doc })
      }
    }
    else {
      this.insert(doc)
    }
    this.saveCallback()
    return doc
  }

  aggregate(pipeline: AggregateStage[]) {
    let result = [...this.data]

    for (const stage of pipeline) {
      if ('$match' in stage) {
        result = this.executeMatchStage(result, stage.$match)
      }
      else if ('$sort' in stage) {
        result = this.executeSortStage(result, stage.$sort)
      }
      else if ('$group' in stage) {
        result = this.executeGroupStage(result, stage.$group)
      }
      else if ('$limit' in stage) {
        result = result.slice(0, stage.$limit)
      }
      else if ('$skip' in stage) {
        result = result.slice(stage.$skip)
      }
    }

    return result
  }

  populate(field: string, options: PopulateOptions) {
    const results = this.executeQuery()
    const foreignDb = options.from

    return results.map((item) => {
      if (Array.isArray(item[options.localField])) {
        const populated = item[options.localField].map((foreignId: string) => {
          return foreignDb.data.find((foreign: any) => foreign.id === foreignId)
        })
        return { ...item, [field]: populated }
      }
      else {
        const populated = foreignDb.data.find(
          (foreign: any) => foreign[options.foreignField] === item[options.localField],
        )
        return { ...item, [field]: populated }
      }
    })
  }

  async transaction<T>(callback: (collection: Collection) => Promise<T>) {
    const snapshot = JSON.stringify(this.data)
    try {
      const result = await callback(this)
      this.saveCallback()
      return result
    }
    catch (error) {
      this.data = JSON.parse(snapshot)
      throw error
    }
  }

  createIndex(field: string, options: IndexOptions = {}) {
    const index = new Map<any, any[]>()

    this.data.forEach((item) => {
      const value = item[field]
      if (!index.has(value)) {
        index.set(value, [])
      }
      index.get(value)?.push(item)
    })

    return index
  }

  setValidator(schema: SchemaDefinition) {
    this.validator = new Validator(schema)
    return this
  }

  private validateDocument(doc: any) {
    if (!this.validator)
      return { isValid: true, errors: [] }

    return this.validator.validate(doc)
  }

  private executeQuery() {
    return this.data.filter((item) => {
      return this.queryChain.every(({ field, operator, value }) => {
        const fieldValue = item[field]

        switch (operator) {
          case '=':
            return fieldValue === value
          case '!=':
            return fieldValue !== value
          case '>':
            return fieldValue > value
          case '>=':
            return fieldValue >= value
          case '<':
            return fieldValue < value
          case '<=':
            return fieldValue <= value
          case 'in':
            return Array.isArray(value) && value.includes(fieldValue)
          case 'not-in':
            return Array.isArray(value) && !value.includes(fieldValue)
          case 'contains':
            if (typeof fieldValue === 'string') {
              return fieldValue.includes(String(value))
            }
            if (Array.isArray(fieldValue)) {
              return fieldValue.includes(value)
            }
            return false
          case 'starts-with':
            return typeof fieldValue === 'string'
              && fieldValue.startsWith(String(value))
          case 'ends-with':
            return typeof fieldValue === 'string'
              && fieldValue.endsWith(String(value))
          case 'exists':
            return value ? field in item : !(field in item)
          case 'between':
            return fieldValue >= value[0] && fieldValue <= value[1]
          case 'is empty':
            return fieldValue === '' || fieldValue === null || fieldValue === undefined || (Array.isArray(fieldValue) && fieldValue.length === 0)
          case 'is not empty':
            return fieldValue !== '' && fieldValue !== null && fieldValue !== undefined || (Array.isArray(fieldValue) && fieldValue.length > 0)
          default:
            return false
        }
      })
    })
  }

  private generateId(): string {
    return Math.random().toString(36).substr(2, 9)
  }

  private executeMatchStage(data: any[], conditions: any) {
    return data.filter(item => this.matchConditions(item, conditions))
  }

  private executeSortStage(data: any[], sortBy: Record<string, 1 | -1> | undefined) {
    if (!sortBy)
      return data
    return [...data].sort((a, b) => {
      for (const [field, order] of Object.entries(sortBy)) {
        if (a[field] < b[field])
          return -1 * order
        if (a[field] > b[field])
          return 1 * order
      }
      return 0
    })
  }

  private executeGroupStage(data: any[], group: any) {
    const groups = new Map()

    for (const item of data) {
      const key = group._id(item)
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key).push(item)
    }

    return Array.from(groups.entries()).map(([key, items]) => {
      const result: any = { _id: key }

      for (const [field, accumulator] of Object.entries(group)) {
        if (field === '_id')
          continue
        result[field] = this.executeAccumulator(accumulator, items)
      }

      return result
    })
  }

  private executeAccumulator(accumulator: any, items: any[]) {
    if (typeof accumulator === 'function') {
      return accumulator(items)
    }
    if (accumulator.$sum) {
      const field = accumulator.$sum
      return items.reduce((sum, item) => {
        const value = field === 1 ? 1 : item[field]
        return sum + (value || 0)
      }, 0)
    }
    if (accumulator.$avg) {
      const field = accumulator.$avg
      if (items.length === 0)
        return 0
      const sum = items.reduce((s, item) => s + (item[field] || 0), 0)
      return sum / items.length
    }
    return null
  }

  private matchConditions(item: any, conditions: any): boolean {
    for (const [field, value] of Object.entries(conditions)) {
      if (item[field] !== value)
        return false
    }
    return true
  }
}

interface AggregateStage {
  $match?: Record<string, any>
  $sort?: Record<string, 1 | -1>
  $group?: {
    _id: (item: any) => any
    [key: string]: any
  }
  $limit?: number
  $skip?: number
}

interface PopulateOptions {
  from: Collection
  localField: string
  foreignField: string
}

interface IndexOptions {
  unique?: boolean
}
