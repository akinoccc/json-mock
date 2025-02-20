import { readFileSync, writeFileSync } from 'node:fs'
import { rm } from 'node:fs/promises'
import path from 'node:path'
import { createLogger } from '../logger'
import { Collection } from './Collection'
import { ModelManager } from './ModelManager'
import { ModelScanner } from './ModelScanner'
import chalk from 'chalk'

const logger = createLogger('DB') // 创建DB模块logger

export class JsonDB {
  private data: any = {}
  private dbFilePath: string
  private modelsPath: string
  private modelManager: ModelManager
  private modelScanner: ModelScanner

  constructor({ dbPath, modelsPath }: {
    dbPath: string
    modelsPath: string
  }) {
    this.dbFilePath = path.resolve(dbPath)
    this.modelsPath = path.resolve(modelsPath)
    this.loadData()
    this.modelManager = new ModelManager(this)
    this.modelScanner = new ModelScanner(this)
  }

  private loadData() {
    try {
      const content = readFileSync(this.dbFilePath, 'utf-8')
      this.data = JSON.parse(content)
    }
    catch {
      this.data = {}
      this.saveData()
    }
  }

  private saveData() {
    logger.debug('Saving database...')
    try {
      writeFileSync(this.dbFilePath, JSON.stringify(this.data, null, 2))
      logger.trace('Database saved successfully')
    }
    catch (error) {
      logger.error('Failed to save database:', error)
      throw error
    }
  }

  collection(name: string) {
    if (!this.data[name]) {
      this.data[name] = []
      this.saveData()
    }
    return new Collection(this.data[name], () => this.saveData())
  }

  getData(): any[] {
    return this.data
  }

  registerModel(modelClass: any): Collection {
    return this.modelManager.register(modelClass)
  }

  getModel(name: string): Collection {
    return this.modelManager.getModel(name)
  }

  addModelPath(path: string) {
    this.modelScanner.addModelPath(path)
    return this
  }

  dropModel(name: string) {
    delete this.data[name]
    this.saveData()
  }

  async dropDb() {
    logger.warn(chalk`{yellow ▶ 正在清空数据库... 存储文件: {gray ${this.dbFilePath}}}`)
    
    try {
      await rm(this.dbFilePath)
      logger.info(chalk`{green ✔ 数据库清空成功} {gray 已删除文件: ${this.dbFilePath}}`)
    }
    catch (error: any) {
      logger.error(chalk`{red ✗ 数据库清空失败!} {gray 原因:} {white ${error.message}}`)
      throw error
    }
  }

  async initialize() {
    await this.modelScanner
      .addModelPath(this.modelsPath)
      .scan()
  }
}
