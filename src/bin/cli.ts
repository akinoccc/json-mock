#!/usr/bin/env node

import type { Config } from '../types'
import { readFileSync } from 'node:fs'
import path, { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import chalk from 'chalk'
import { program } from 'commander'
import MockServer from '../index'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageJson = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8'))

program
  .version(packageJson.version)
  .option('-p, --port <port>', '设置服务器端口', '3000')
  .option('-d, --delay <ms>', '设置响应延迟', '0')
  .option('--db <path>', '指定db.json文件路径')
  .option('--api <path>', '指定API文件夹路径')
  .parse(process.argv)

const options = program.opts()

const config: Partial<Config> = {
  port: Number.parseInt(options.port),
  delay: Number.parseInt(options.delay),
}

if (options.db) {
  config.dbPath = path.resolve(process.cwd(), options.db)
}

if (options.api) {
  config.apiPath = path.resolve(process.cwd(), options.api)
}

const server = new MockServer(config)
server.start()

console.log(chalk.green(`Mock server is running on port ${config.port}`))
