import type { JsonDB } from './JsonDB'
import { readdir } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { glob } from 'glob'

export class ModelScanner {
  private db: JsonDB
  private modelPaths: string[]

  constructor(db: JsonDB) {
    this.db = db
    this.modelPaths = []
  }

  addModelPath(path: string) {
    this.modelPaths.push(resolve(path))
    return this
  }

  async scan() {
    for (const modelPath of this.modelPaths) {
      const files = await glob('**/*.{ts,js}', {
        cwd: modelPath,
        ignore: ['**/*.d.ts', '**/*.test.ts', '**/*.spec.ts'],
      })

      for (const file of files) {
        const fullPath = join(modelPath, file)
        const module = await import(fullPath)

        // 遍历模块中的所有导出
        for (const exportedItem of Object.values(module)) {
          if (this.isModelClass(exportedItem)) {
            this.db.registerModel(exportedItem)
          }
        }
      }
    }
  }

  private isModelClass(item: any): boolean {
    return typeof item === 'function' && Reflect.hasMetadata('model:name', item)
  }

  // 将 PascalCase 转换为 snake_case
  static classNameToTableName(className: string): string {
    return className
      .replace(/([A-Z])/g, '_$1')
      .toLowerCase()
      .replace(/^_/, '')
  }
}
