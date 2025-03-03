import { beforeEach, describe, expect, it } from 'vitest'
import { Collection } from '../Collection'

describe('collection', () => {
  let collection: Collection
  let saveCallback: () => void
  let testData: any[]

  beforeEach(() => {
    testData = []
    saveCallback = () => {}
    collection = new Collection(testData, saveCallback)
  })

  describe('basic curd operations', () => {
    it('should insert a document', () => {
      collection.insert({ name: '张三', age: 25 })
      expect(testData).toHaveLength(1)
      expect(testData[0]).toMatchObject({
        name: '张三',
        age: 25,
      })
      expect(testData[0].id).toBeDefined()
    })

    it('should query documents', () => {
      collection.insert({ name: '张三', age: 25 })
      collection.insert({ name: '李四', age: 30 })

      const results = collection
        .where('age', '>', 25)
        .find()

      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('李四')
    })

    it('should update a document', () => {
      collection.insert({ name: '张三', age: 25 })

      collection
        .where('name', '=', '张三')
        .updateMany({ age: 26 })

      expect(testData[0].age).toBe(26)
    })

    it('should delete a document', () => {
      collection.insert({ name: '张三', age: 25 })

      collection
        .where('name', '=', '张三')
        .delete()

      expect(testData).toHaveLength(0)
    })
  })

  describe('query operators', () => {
    beforeEach(() => {
      collection.insertMany([
        { name: '张三', age: 25, tags: ['开发', '前端'] },
        { name: '李四', age: 30, tags: ['设计'] },
        { name: '王五', age: 28, tags: ['后端'] },
      ])
    })

    it('should support the equal operator', () => {
      const results = collection.where('age', '=', 25).find()
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('张三')
    })

    it('should support the greater than operator', () => {
      const results = collection.where('age', '>', 25).find()
      expect(results).toHaveLength(2)
    })

    it('should support the in operator', () => {
      const results = collection.where('age', 'in', [25, 30]).find()
      expect(results).toHaveLength(2)
    })

    it('should support the contains operator', () => {
      const results = collection.where('tags', 'contains', '前端').find()
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('张三')
    })

    it('should support the starts-with operator', () => {
      const results = collection.where('name', 'starts-with', '张').find()
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('张三')
    })

    it('should support the ends-with operator', () => {
      const results = collection.where('name', 'ends-with', '三').find()
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('张三')
    })

    it('should support the exists operator', () => {
      const results = collection.where('name', 'exists', true).find()
      expect(results.length).toBeGreaterThan(1)
      expect(results[0].name).toBe('张三')
    })

    it('should support the between operator', () => {
      const results = collection.where('age', 'between', [25, 30]).find()
      expect(results.length).toBeGreaterThan(1)
    })

    it('should support the is empty operator', () => {
      const results = collection.where('name', 'is empty').find()
      expect(results).toHaveLength(0)
      expect(results[0]).toBeUndefined()
    })

    it('should support the is not empty operator', () => {
      const results = collection.where('name', 'is not empty').find()
      expect(results.length).toBeGreaterThan(1)
      expect(results[0].name).toBeTruthy()
    })
  })

  describe('aggregation operations', () => {
    beforeEach(() => {
      collection.insertMany([
        { name: '张三', age: 25, role: 'dev' },
        { name: '李四', age: 30, role: 'dev' },
        { name: '王五', age: 28, role: 'designer' },
      ])
    })

    it('should support the $match stage', () => {
      const results = collection.aggregate([
        { $match: { role: 'dev' } },
      ])
      expect(results).toHaveLength(2)
    })

    it('should support the $sort stage', () => {
      const results = collection.aggregate([
        { $sort: { age: -1 } },
      ])
      expect(results[0].age).toBe(30)
    })

    it('should support the $group stage', () => {
      const results = collection.aggregate([
        {
          $group: {
            _id: item => item.role,
            count: { $sum: 1 },
            avgAge: { $avg: 'age' },
            totalAge: { $sum: 'age' },
          },
        },
      ])

      expect(results).toHaveLength(2)

      const devGroup = results.find(r => r._id === 'dev')
      expect(devGroup).toBeDefined()
      expect(devGroup.count).toBe(2)
      expect(devGroup.avgAge).toBe(27.5)
      expect(devGroup.totalAge).toBe(55)

      const designerGroup = results.find(r => r._id === 'designer')
      expect(designerGroup).toBeDefined()
      expect(designerGroup.count).toBe(1)
      expect(designerGroup.avgAge).toBe(28)
      expect(designerGroup.totalAge).toBe(28)
    })

    it('should handle empty groups', () => {
      const results = collection.aggregate([
        {
          $match: { role: 'not-exist' },
        },
        {
          $group: {
            _id: item => item.role,
            count: { $sum: 1 },
            avgAge: { $avg: 'age' },
          },
        },
      ])

      expect(results).toHaveLength(0)
    })
  })
})
