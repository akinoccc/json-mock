import type { Collection } from '../Collection'
import { rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AutoIncrement, Field, Model } from '../decorators'
import { JsonDB } from '../JsonDB'

const TEST_DB_PATH = resolve(__dirname, './test.json')

@Model()
class User {
  @AutoIncrement()
  @Field({ type: 'number' })
  id!: number

  @Field({ type: 'string', required: true, min: 2, max: 50 })
  name!: string

  @Field({ type: 'number', min: 0, max: 150 })
  age?: number
}

@Model({ name: 'articles' })
class BlogPost {
  @AutoIncrement()
  @Field({ type: 'number' })
  id!: number

  @Field({ type: 'string', required: true })
  title!: string

  @Field({ type: 'string' })
  content?: string

  @Field({ type: 'number', ref: 'user' })
  authorId!: number
}

describe('模型系统', () => {
  let db: JsonDB
  let dbPath: string

  beforeEach(async () => {
    // 为每个测试用例创建唯一的数据库文件
    dbPath = resolve(__dirname, `./test-${Date.now()}-${Math.random().toString(36).slice(2)}.json`)
    db = new JsonDB(dbPath)
    await rm(dbPath).catch(() => {})
  })

  afterEach(async () => {
    // 测试结束后清理数据库文件
    await rm(dbPath).catch(() => {})
  })

  describe('模型注册', () => {
    it('应该正确注册模型', () => {
      const userModel = db.registerModel(User)
      expect(userModel).toBeDefined()
      expect(db.getModel('user')).toBe(userModel)
    })

    it('应该支持自定义表名', () => {
      const postModel = db.registerModel(BlogPost)
      expect(postModel).toBeDefined()
      expect(db.getModel('articles')).toBe(postModel)
    })

    it('未注册的模型应该抛出错误', () => {
      expect(() => db.getModel('not_exists')).toThrow('模型 not_exists 未注册')
    })
  })

  describe('模型扫描', () => {
    it('应该自动扫描并注册模型', async () => {
      db.addModelPath('./src/models')
      await db.initialize()

      const userModel = db.getModel('user')
      const blogPostModel = db.getModel('blog_post')

      expect(userModel).toBeDefined()
      expect(blogPostModel).toBeDefined()
    })
  })

  describe('数据验证', () => {
    it('应该验证必填字段', () => {
      const userModel = db.registerModel(User)
      expect(() => userModel.insert({})).toThrow('字段 name 是必填的')
    })

    it('应该验证字段长度', () => {
      const userModel = db.registerModel(User)
      expect(() => userModel.insert({ name: 'a' })).toThrow('字段 name 的长度不能小于 2')
    })

    it('应该验证数值范围', () => {
      const userModel = db.registerModel(User)
      expect(() => userModel.insert({
        name: 'test',
        age: -1,
      })).toThrow('字段 age 不能小于 0')
    })
  })

  describe('数据操作', () => {
    let userModel: Collection

    beforeEach(() => {
      userModel = db.registerModel(User)
    })

    it('应该正确插入数据', () => {
      const user = userModel.insert({
        name: '张三',
        age: 25,
      })
      expect(user).toBeDefined()
      expect(user.id).toBeDefined()
    })

    it('应该支持批量插入', () => {
      const users = userModel.insertMany([
        { name: '张三', age: 25 },
        { name: '李四', age: 30 },
      ])
      expect(users).toHaveLength(2)
      expect(users[0].id).toBeDefined()
      expect(users[1].id).toBeDefined()
    })

    it('应该支持查询操作', () => {
      userModel.insertMany([
        { name: '张三', age: 25 },
        { name: '李四', age: 30 },
      ])

      const result = userModel
        .where('age', '>', 25)
        .find()

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('李四')
    })

    it('应该支持更新操作', () => {
      userModel.insert({ name: '张三', age: 25 })

      userModel
        .where('name', '==', '张三')
        .update({ age: 26 })

      const updated = userModel.findOne()
      expect(updated.age).toBe(26)
    })

    it('应该支持删除操作', () => {
      userModel.insert({ name: '张三', age: 25 })

      userModel
        .where('name', '==', '张三')
        .delete()

      const result = userModel.find()
      expect(result).toHaveLength(0)
    })
  })

  describe('关联查询', () => {
    let userModel: Collection
    let postModel: Collection

    beforeEach(() => {
      userModel = db.registerModel(User)
      postModel = db.registerModel(BlogPost)

      userModel.insert({ id: 1, name: '张三', age: 25 })
      postModel.insert({
        id: 1,
        title: '测试文章',
        content: '这是内容...',
        authorId: 1,
      })
    })

    it('应该支持关联查询', () => {
      const posts = postModel
        .where('authorId', '==', 1)
        .populate('author', {
          from: userModel,
          localField: 'authorId',
          foreignField: 'id',
        })

      expect(posts).toHaveLength(1)
      expect(posts[0].author.name).toBe('张三')
    })
  })

  describe('事务操作', () => {
    let userModel: Collection

    beforeEach(() => {
      userModel = db.registerModel(User)
    })

    it('应该支持事务回滚', async () => {
      await userModel.insert({ name: '张三', age: 25 })

      try {
        await userModel.transaction(async (collection) => {
          collection.update({ age: 26 })
          throw new Error('测试回滚')
        })
      }
      catch (error) {
        // 预期的错误
      }

      const user = userModel.findOne()
      expect(user.age).toBe(25) // 应该回滚到原始状态
    })

    it('应该支持事务提交', async () => {
      await userModel.insert({ name: '张三', age: 25 })

      await userModel.transaction(async (collection) => {
        await collection.update({ age: 26 })
      })

      const user = userModel.findOne()
      expect(user.age).toBe(26) // 应该提交更新
    })
  })
})
