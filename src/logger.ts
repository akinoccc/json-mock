import log from 'loglevel'
import prefix from 'loglevel-plugin-prefix'
import chalk from 'chalk'

// 初始化前缀插件
prefix.reg(log)
prefix.apply(log, {
  template: `${chalk.black('%t')} [%l] [%n]`,
    timestampFormatter: (date) => {
        const year = date.getFullYear()
        const month = (date.getMonth() + 1).toString().padStart(2, '0')
        const day = date.getDate().toString().padStart(2, '0')
        const hour = date.getHours().toString().padStart(2, '0')
        const minute = date.getMinutes().toString().padStart(2, '0')
        const second = date.getSeconds().toString().padStart(2, '0')
        return chalk.gray(`${year}-${month}-${day} ${hour}:${minute}:${second}`)
    },
  levelFormatter: (level) => {
    const colorMap = {
      TRACE: chalk.gray,
      DEBUG: chalk.cyan,
      INFO: chalk.green,
      WARN: chalk.yellow,
      ERROR: chalk.red
    } as Record<string, (str: string) => string>;
    return colorMap[level.toUpperCase()]?.(level.padEnd(5)) || level;
  },
  nameFormatter: (name) => chalk.blue(name || 'App')
})

// 创建不同模块的logger实例
export function createLogger(name?: string) {
  const logger = log.getLogger(name || 'App')
  logger.setLevel((process.env.LOG_LEVEL || 'info') as log.LogLevelDesc)
  return logger
}

// 应用默认logger
export const logger = createLogger()
