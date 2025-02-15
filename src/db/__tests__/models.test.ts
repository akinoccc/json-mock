import type { Collection } from '../Collection'
import { rm } from 'node:fs/promises'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AutoIncrement, Field, Model } from '../decorators'
import { JsonDB } from '../JsonDB'

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

describe('model system', () => {
  let db: JsonDB
  let dbPath: string

  beforeEach(async () => {
    // Create a unique database file for each test case
    dbPath = resolve(__dirname, `./test-${Date.now()}-${Math.random().toString(36).slice(2)}.json`)
    db = new JsonDB({
      dbPath,
      modelsPath: resolve(__dirname, './models'),
    })
    await db.initialize()
  })

  afterEach(async () => {
    // Clean up the database file after each test
    await rm(dbPath).catch(() => {})
  })

  describe('model registration', () => {
    it('should correctly register a model', () => {
      const userModel = db.registerModel(User)
      expect(userModel).toBeDefined()
      expect(db.getModel('user')).toBe(userModel)
    })

    it('should support custom table names', () => {
      const postModel = db.registerModel(BlogPost)
      expect(postModel).toBeDefined()
      expect(db.getModel('articles')).toBe(postModel)
    })

    it('should throw an error if a model is not registered', () => {
      expect(() => db.getModel('not_exists')).toThrow('the model not_exists is not registered')
    })
  })

  describe('model scanning', () => {
    it('should automatically scan and register models', async () => {
      const userModel = db.getModel('user')
      const blogPostModel = db.getModel('blog_post')

      expect(userModel).toBeDefined()
      expect(blogPostModel).toBeDefined()
    })
  })

  describe('data validation', () => {
    it('should validate required fields', () => {
      const userModel = db.registerModel(User)
      expect(() => userModel.insert({})).toThrow('validation failed: the field `name` is required')
    })

    it('should validate field length', () => {
      const userModel = db.registerModel(User)
      expect(() => userModel.insert({ name: 'a' })).toThrow('validation failed: the field `name` length must be greater than 2')
    })

    it('should validate numeric range', () => {
      const userModel = db.registerModel(User)
      expect(() => userModel.insert({
        name: 'test',
        age: -1,
      })).toThrow('validation failed: the field `age` must be greater than 0')
    })
  })

  describe('data operations', () => {
    let userModel: Collection

    beforeEach(() => {
      userModel = db.registerModel(User)
    })

    it('should correctly insert data', () => {
      const user = userModel.insert({
        name: 'Hua Li',
        age: 25,
      })
      expect(user).toBeDefined()
      expect(user.id).toBeDefined()
    })

    it('should support batch insertion', () => {
      const users = userModel.insertMany([
        { name: 'Hua Li', age: 25 },
        { name: 'Ling Ling Wang', age: 30 },
      ])
      expect(users).toHaveLength(2)
      expect(users[0].id).toBeDefined()
      expect(users[1].id).toBeDefined()
    })

    it('should support query operations', () => {
      userModel.insertMany([
        { name: 'Hua Li', age: 25 },
        { name: 'Ling Ling Wang', age: 30 },
      ])

      const result = userModel
        .where('age', '>', 25)
        .find()

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Ling Ling Wang')
    })

    it('should support update operations', () => {
      userModel.insert({ name: 'Hua Li', age: 25 })

      userModel
        .where('name', '=', 'Hua Li')
        .updateMany({ age: 26 })

      const updated = userModel.findOne()
      expect(updated.age).toBe(26)
    })

    it('should support delete operations', () => {
      userModel.insert({ name: 'Hua Li', age: 25 })

      userModel
        .where('name', '=', 'Hua Li')
        .delete()

      const result = userModel.find()
      expect(result).toHaveLength(0)
    })
  })

  describe('association query', () => {
    let userModel: Collection
    let postModel: Collection

    beforeEach(() => {
      userModel = db.registerModel(User)
      postModel = db.registerModel(BlogPost)

      userModel.insert({ id: 1, name: 'Hua Li', age: 25 })
      postModel.insert({
        id: 1,
        title: 'test article',
        content: 'this is content...',
        authorId: 1,
      })
    })

    it('should support association query', () => {
      const posts = postModel
        .where('authorId', '=', 1)
        .populate('author', {
          from: userModel,
          localField: 'authorId',
          foreignField: 'id',
        })

      expect(posts).toHaveLength(1)
      expect(posts[0].author.name).toBe('Hua Li')
    })
  })

  describe('transaction operations', () => {
    let userModel: Collection

    beforeEach(() => {
      userModel = db.registerModel(User)
    })

    it('should support transaction rollback', async () => {
      await userModel.insert({ name: 'Hua Li', age: 25 })

      try {
        await userModel.transaction(async (collection) => {
          collection.updateMany({ age: 26 })
          throw new Error('test rollback')
        })
      }
      catch (error) {
        // Expected error
      }

      const user = userModel.findOne()
      expect(user.age).toBe(25) // Should roll back to the original state
    })

    it('should support transaction commit', async () => {
      await userModel.insert({ name: 'Hua Li', age: 25 })

      await userModel.transaction(async (collection) => {
        await collection.updateMany({ age: 26 })
      })

      const user = userModel.findOne()
      expect(user.age).toBe(26) // Should commit the update
    })
  })
})
