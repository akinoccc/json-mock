import type { Config } from './types'
import { join } from 'node:path'
import { glob } from 'glob'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'

class ConfigManager {
  private options: Config
  private databases: Map<string, Low<any>>

  constructor(options: Config) {
    this.options = options
    this.databases = new Map()
  }

  /**
   * @description Initialize the data source
   * @returns void
   */
  public async initializeDataSource(): Promise<void> {
    if (this.options.dbPath) {
      const adapter = new JSONFile(this.options.dbPath)
      const db = new Low(adapter, {})
      await db.read()
      this.databases.set('default', db)
    }
    else if (this.options.apiPath) {
      const files = glob.sync(join(this.options.apiPath, '**/*.json'))
      for (const file of files) {
        const relativePath = join(this.options.apiPath!, file)
        const resource = join(relativePath).split('/').slice(-2)[0]
        const adapter = new JSONFile(file)

        // Check if the database instance for this resource already exists
        if (!this.databases.has(resource)) {
          // If it doesn't exist, create a new database instance
          const db = new Low(adapter, {})
          await db.read()
          this.databases.set(resource, db)
        }
        else {
          // If it exists, merge the data
          const existingDb = this.databases.get(resource)
          const newDb = new Low(adapter, {})
          await newDb.read()

          if (existingDb?.data && newDb.data) {
            existingDb.data = {
              ...existingDb.data,
              ...newDb.data,
            }
          }
        }
      }
    }
  }

  /**
   * @description Get the database for a resource
   * @returns The database data for the resource
   */
  public getDatabase(): Low<any>['data'] | undefined {
    const dbName = this.options.apiPath?.split('/').slice(-1)[0] || 'default'
    const db = this.databases.get(dbName)
    if (!db)
      return undefined

    return db
  }
}

export default ConfigManager
