import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { Collection } from './Collection'
import { ModelManager } from './ModelManager'
import { ModelScanner } from './ModelScanner'

export class JsonDB {
  private data: any
  private filePath: string
  private queryChain: any[]
  private modelManager: ModelManager
  private modelScanner: ModelScanner

  constructor(dbPath: string) {
    this.filePath = path.resolve(dbPath)
    this.loadData()
    this.queryChain = []
    this.modelManager = new ModelManager(this)
    this.modelScanner = new ModelScanner(this)
  }

  private loadData() {
    try {
      const content = readFileSync(this.filePath, 'utf-8')
      this.data = JSON.parse(content)
    }
    catch (error) {
      this.data = {}
      this.saveData()
    }
  }

  private saveData() {
    writeFileSync(this.filePath, JSON.stringify(this.data, null, 2))
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

  async initialize() {
    await this.modelScanner.scan()
  }
}
