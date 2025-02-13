import type { NextFunction, Request, Response } from 'express'
import MockServer from '../src/index'

const server = new MockServer({
  port: 3000,
  dbPath: 'db.json', // 或者使用 apiPath: "api"
})

const app = server.getApp()

// 添加自定义中间件
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`)
  next()
})

// 添加自定义路由
server.addCustomRoute('get', '/echo', (req: Request, res: Response) => {
  res.jsonp(req.query)
})

// 添加自定义响应处理
server.pre((req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'POST') {
    req.body.createdAt = Date.now()
  }
  next()
})

server.start()
