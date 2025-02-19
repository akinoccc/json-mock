import { describe, expect, expectTypeOf, it } from 'vitest'
import Service from '../src/service'
import { getRandomString } from './util'
import { Collection } from '../src/db'

describe('service test', () => {
  it('should initialize database', async () => {
    const config = new Service({
      dbStoragePath: new URL(`./data-${getRandomString()}.json`, import.meta.url).pathname,
      dbModelPath: new URL('./models.ts', import.meta.url).pathname,
    })

    const db = config.getDatabase()
    await db.initialize()

    expect(db).toBeTruthy()
    expectTypeOf(db.getModel('users')).toEqualTypeOf<Collection>() // Collection 实例
    expectTypeOf(db.getModel('posts')).toEqualTypeOf<Collection>() // Collection 实例

    await db.dropDb()
  })
})
