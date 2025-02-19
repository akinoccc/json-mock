import type { JsonDB } from './JsonDB'
import { promises as fs } from 'node:fs'
import { join } from 'node:path'
import { exit } from 'node:process'

import { glob } from 'glob'
import { loadConfig } from 'unconfig'

export class ModelScanner {
  private db: JsonDB
  private modelPaths: string[]

  constructor(db: JsonDB) {
    this.db = db
    this.modelPaths = []
  }

  addModelPath(path: string) {
    this.modelPaths.push(path)
    return this
  }

  async scan() {
    for (const modelPath of this.modelPaths) {
      try {
        const stat = await fs.stat(modelPath)

        if (stat.isDirectory()) {
          // 如果是目录，使用 glob 搜索
          const files = await glob('**/*.{ts,js}', {
            cwd: modelPath,
            ignore: ['**/*.d.ts', '**/*.test.ts', '**/*.spec.ts'],
          })

          for (const file of files) {
            await this.loadModelFile(join(modelPath, file))
          }
        }
        else if (stat.isFile()) {
          // 如果是文件，直接加载
          await this.loadModelFile(modelPath)
        }
      }
      catch (error) {
        console.error(`扫描路径失败: ${modelPath}`, error)
      }
    }
  }

  private async loadModelFile(fullPath: string) {
    try {
      // const module = await import(fullPath)
      const { config: module } = await loadConfig({
        sources: [

          {
            files: fullPath,
            // default extensions
            extensions: [''],
            parser: 'import',
          },
        ],
      })

      // 遍历模块中的所有导出
      for (const exportedItem of Object.values(module as object)) {
        if (this.isModelClass(exportedItem)) {
          this.db.registerModel(exportedItem)
        }
      }
    }
    catch (error) {
      console.error(`Load model failed: ${fullPath}`, error)
      exit(1)
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
