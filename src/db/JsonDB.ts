import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { Collection } from './Collection'
import { ModelManager } from './ModelManager'
import { ModelScanner } from './ModelScanner'
import { rm } from 'node:fs/promises'

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
    catch (error) {
      this.data = {}
      this.saveData()
    }
  }

  private saveData() {
    writeFileSync(this.dbFilePath, JSON.stringify(this.data, null, 2))
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
    this.data = {}
    await rm(this.dbFilePath)
  }

  async initialize() {
    await this.modelScanner
      .addModelPath(this.modelsPath)
      .scan()
  }
}
