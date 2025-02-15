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

  describe('基本 CRUD 操作', () => {
    it('应该插入文档', () => {
      collection.insert({ name: '张三', age: 25 })
      expect(testData).toHaveLength(1)
      expect(testData[0]).toMatchObject({
        name: '张三',
        age: 25,
      })
      expect(testData[0].id).toBeDefined()
    })

    it('应该查询文档', () => {
      collection.insert({ name: '张三', age: 25 })
      collection.insert({ name: '李四', age: 30 })

      const results = collection
        .where('age', '>', 25)
        .find()

      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('李四')
    })

    it('应该更新文档', () => {
      collection.insert({ name: '张三', age: 25 })

      collection
        .where('name', '==', '张三')
        .update({ age: 26 })

      expect(testData[0].age).toBe(26)
    })

    it('应该删除文档', () => {
      collection.insert({ name: '张三', age: 25 })

      collection
        .where('name', '==', '张三')
        .delete()

      expect(testData).toHaveLength(0)
    })
  })

  describe('查询操作符', () => {
    beforeEach(() => {
      collection.insertMany([
        { name: '张三', age: 25, tags: ['开发', '前端'] },
        { name: '李四', age: 30, tags: ['设计'] },
        { name: '王五', age: 28, tags: ['后端'] },
      ])
    })

    it('应该支持等于操作符', () => {
      const results = collection.where('age', '==', 25).find()
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('张三')
    })

    it('应该支持大于操作符', () => {
      const results = collection.where('age', '>', 25).find()
      expect(results).toHaveLength(2)
    })

    it('应该支持 in 操作符', () => {
      const results = collection.where('age', 'in', [25, 30]).find()
      expect(results).toHaveLength(2)
    })

    it('应该支持 contains 操作符', () => {
      const results = collection.where('tags', 'contains', '前端').find()
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('张三')
    })
  })

  describe('聚合操作', () => {
    beforeEach(() => {
      collection.insertMany([
        { name: '张三', age: 25, role: 'dev' },
        { name: '李四', age: 30, role: 'dev' },
        { name: '王五', age: 28, role: 'designer' },
      ])
    })

    it('应该支持 $match 阶段', () => {
      const results = collection.aggregate([
        { $match: { role: 'dev' } },
      ])
      expect(results).toHaveLength(2)
    })

    it('应该支持 $sort 阶段', () => {
      const results = collection.aggregate([
        { $sort: { age: -1 } },
      ])
      expect(results[0].age).toBe(30)
    })

    it('应该支持 $group 阶段', () => {
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

    it('应该处理空组的聚合', () => {
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
