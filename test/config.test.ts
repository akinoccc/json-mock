import path from 'node:path'
import { describe, expect, it } from 'vitest'
import ConfigManager from '../src/config'

describe('configManager Test', () => {
  it('should initialize data source', async () => {
    const config = new ConfigManager({
      port: 3000,
      delay: 0,
      prefix: '/api',
      dbPath: path.join(__dirname, 'fixtures/db.json'),
    })

    await config.initializeDataSource()
    const db = config.getDatabase()
    expect(db).toBeTruthy()
  })

  it('should handle multiple JSON files', async () => {
    const config = new ConfigManager({
      port: 3000,
      delay: 0,
      prefix: '/api',
      apiPath: path.join(__dirname, 'fixtures/api'),
    })

    await config.initializeDataSource()
    const usersDb = config.getDatabase()
    expect(usersDb).toBeTruthy()

    const postsDb = config.getDatabase()
    expect(postsDb).toBeTruthy()
  })
})
