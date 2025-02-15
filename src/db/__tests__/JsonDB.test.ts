import { rm, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { JsonDB } from '../JsonDB'

describe('jsonDB', () => {
  const testDbPath = resolve(__dirname, './test.json')
  let db: JsonDB

  beforeEach(() => {
    db = new JsonDB({
      dbPath: testDbPath,
      modelsPath: resolve(__dirname, './models'),
    })
  })

  afterEach(() => {
    rm(testDbPath, () => {})
  })

  it('should create a new database instance', () => {
    expect(db).toBeInstanceOf(JsonDB)
  })

  it('should create a new collection', () => {
    const collection = db.collection('users')
    expect(collection).toBeDefined()
  })

  it('should load data from an existing file', () => {
    const initialData = {
      users: [
        { id: '1', name: '张三' },
      ],
    }
    writeFileSync(testDbPath, JSON.stringify(initialData))

    const newDb = new JsonDB({
      dbPath: testDbPath,
      modelsPath: resolve(__dirname, '../models'),
    })
    expect(newDb.getData()).toEqual(initialData)
  })
})
