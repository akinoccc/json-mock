import { JsonDB } from './db'

class Service {
  private db: JsonDB

  constructor(options: {
    dbStoragePath: string
    dbModelPath: string
  }) {
    if (!options.dbModelPath) {
      throw new Error('dbModelPath is required')
    }

    this.db = new JsonDB({
      dbPath: options.dbStoragePath,
      modelsPath: options.dbModelPath,
    })
  }

  public async initialize() {
    await this.db.initialize()
  }

  public getDatabase() {
    return this.db
  }
}

export default Service
