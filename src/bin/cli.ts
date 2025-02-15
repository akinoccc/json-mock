#!/usr/bin/env node

import type { Config } from '../types'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import chalk from 'chalk'
import { program } from 'commander'
import MockServer from '../index'

const __dirname = dirname(fileURLToPath(import.meta.url))
const packageJson = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8'))

program
  .version(packageJson.version)
  .option('-p, --port <port>', 'Set server port', '3000')
  .option('-d, --delay <ms>', 'Set response delay', '0')
  .option('--db-storage-path <path>', 'Set db storage file path')
  .option('--db-model-path <path>', 'Set db models file or folder path')
  .parse(process.argv)

const options = program.opts()

const config: Config = {
  port: Number.parseInt(options.port),
  delay: Number.parseInt(options.delay),
  dbStoragePath: options.dbStoragePath,
  dbModelPath: options.dbModelPath,
}

const server = new MockServer(config)
server.start()

console.log(chalk.green(`Mock server is running on port ${config.port}`))
