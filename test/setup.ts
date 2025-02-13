import fs from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll } from 'vitest'
import ConfigManager from '../src/config'

const aggregatedDbPath = path.join(__dirname, 'fixtures/db.json')
const userDbPath = path.join(__dirname, 'fixtures/api/users.json')
const postDbPath = path.join(__dirname, 'fixtures/api/posts.json')

let aggregatedConfig: ConfigManager
let userConfig: ConfigManager
let postConfig: ConfigManager

// Initialize the database
beforeAll(async () => {
  // Create JSON files
  const userData = {
    users: [
      {
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
      },
      {
        id: 2,
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
      },
    ],
  }

  const postData = {
    posts: [
      {
        id: 1,
        title: 'Post 1',
        content: 'Content 1',
      },
      {
        id: 2,
        title: 'Post 2',
        content: 'Content 2',
      },
    ],
  }

  fs.writeFileSync(aggregatedDbPath, JSON.stringify({ ...userData, ...postData }, null, 2))
  fs.writeFileSync(userDbPath, JSON.stringify(userData, null, 2))
  fs.writeFileSync(postDbPath, JSON.stringify(postData, null, 2))

  aggregatedConfig = new ConfigManager({
    port: 3000,
    dbPath: aggregatedDbPath,
  })

  userConfig = new ConfigManager({
    port: 3000,
    dbPath: userDbPath,
  })

  postConfig = new ConfigManager({
    port: 3000,
    dbPath: postDbPath,
  })

  await aggregatedConfig.initializeDataSource()
  await userConfig.initializeDataSource()
  await postConfig.initializeDataSource()
})

// Clean up the database
afterAll(async () => {
  await aggregatedConfig.resetDatabase()
  await userConfig.resetDatabase()
  await postConfig.resetDatabase()
})
