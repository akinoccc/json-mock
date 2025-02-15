import type Service from '../src/service'
import fs from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll } from 'vitest'

const aggregatedDbPath = path.join(__dirname, 'fixtures/db.json')
const userDbPath = path.join(__dirname, 'fixtures/api/users.json')
const postDbPath = path.join(__dirname, 'fixtures/api/posts.json')

let aggregatedConfig: Service
let userConfig: Service
let postConfig: Service

beforeAll(async () => {
  // // 创建测试数据
  // const initialData = {
  //   users: [],
  //   posts: [],
  // }

  // fs.writeFileSync(aggregatedDbPath, JSON.stringify(initialData, null, 2))
  // fs.writeFileSync(userDbPath, JSON.stringify({ users: [] }, null, 2))
  // fs.writeFileSync(postDbPath, JSON.stringify({ posts: [] }, null, 2))

  // aggregatedConfig = new ConfigManager({
  //   port: 3000,
  //   dbPath: aggregatedDbPath,
  // })

  // userConfig = new ConfigManager({
  //   port: 3000,
  //   dbPath: userDbPath,
  // })

  // postConfig = new ConfigManager({
  //   port: 3000,
  //   dbPath: postDbPath,
  // })

  // await aggregatedConfig.initializeDataSource()
  // await userConfig.initializeDataSource()
  // await postConfig.initializeDataSource()
})
