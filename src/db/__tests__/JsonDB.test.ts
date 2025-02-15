import { rm, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { JsonDB } from '../JsonDB'

describe('jsonDB', () => {
  const testDbPath = resolve(__dirname, './test.json')
  let db: JsonDB

  beforeEach(() => {
    db = new JsonDB(testDbPath)
  })

  afterEach(() => {
    // 清理测试数据库文件
    rm(testDbPath, () => {})
  })

  it('应该创建新的数据库实例', () => {
    expect(db).toBeInstanceOf(JsonDB)
  })

  it('应该创建新的集合', () => {
    const collection = db.collection('users')
    expect(collection).toBeDefined()
  })

  it('应该从现有文件加载数据', () => {
    const initialData = {
      users: [
        { id: '1', name: '张三' },
      ],
    }
    writeFileSync(testDbPath, JSON.stringify(initialData))

    const newDb = new JsonDB(testDbPath)
    expect(newDb.getData()).toEqual(initialData)
  })
})
