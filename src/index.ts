import type { Express, NextFunction, Request, Response } from 'express'
import type log from 'loglevel'
import type {
  AuthenticatedRequest,
  Config,
  PaginatedResponse,
  QueryParams,
  ValidationSchema,
} from './types'
import bodyParser from 'body-parser'
import chalk from 'chalk'
import cors from 'cors'
import express from 'express'
import Auth from './auth'
import { createLogger } from './logger'
import Service from './service'
import { getFilterOperator } from './utils'
import Validator from './validator'

class MockServer {
  private config: Config
  private app: Express
  private configManager: Service
  private validator: Validator
  private auth: Auth
  private middlewares: {
    pre: Array<(req: Request, res: Response, next: NextFunction) => void>
    post: Array<(req: Request, res: Response, next: NextFunction) => void>
  }

  private logger: log.Logger

  /**
   * @description Initialize the mock server
   * @param config - The configuration for the mock server
   * @returns void
   */
  constructor(config = {
    port: 3000,
    delay: 0,
    prefix: '/api',
    dbModelPath: '',
    dbStoragePath: '',
  } as Config) {
    console.log(config)
    this.config = config

    this.app = express()
    this.configManager = new Service(this.config)
    this.validator = new Validator()
    this.auth = new Auth(this.config.auth)
    this.middlewares = {
      pre: [],
      post: [],
    }
    this.logger = createLogger('Server')
    this.logger.setLevel(config.logLevel || 'info')
  }

  /**
   * @description Setup the middlewares for the mock server
   * @returns void
   */
  private setupMiddlewares(): void {
    this.app.use(cors())
    this.app.use(bodyParser.json())
    this.app.use(bodyParser.urlencoded({ extended: true }))

    if ((this.config.delay ?? 0) > 0) {
      this.app.use((req: Request, res: Response, next: NextFunction) => {
        setTimeout(next, this.config.delay)
      })
    }

    if (this.config.auth?.enabled) {
      this.app.use(this.auth.middleware())
    }
  }

  /**
   * @description Add a middleware to the pre-processing middlewares
   * @param middleware - The middleware to add
   * @returns this
   */
  public pre(middleware: (req: Request, res: Response, next: NextFunction) => void): this {
    this.middlewares.pre.push(middleware)
    return this
  }

  /**
   * @description Add a middleware to the post-processing middlewares
   * @param middleware - The middleware to add
   * @returns this
   */
  public post(middleware: (req: Request, res: Response, next: NextFunction) => void): this {
    this.middlewares.post.push(middleware)
    return this
  }

  /**
   * @description Start the mock server
   * @returns void
   */
  public async start(): Promise<void> {
    // console.info(chalk.blue(`\n┌${'─'.repeat(40)}`))
    console.info(chalk.blue.bold('\n Mock Server Starting... \n'))
    // console.info(chalk.blue(`└${'─'.repeat(40)}\n`))

    await this.configManager.initialize()
    console.info(chalk.green('▶ Config manager initialized'))

    this.setupMiddlewares()
    console.info(chalk.green(`▶ Middlewares loaded (Total: ${this.middlewares.pre.length + this.middlewares.post.length})`))

    this.middlewares.pre.forEach(middleware => this.app.use(middleware))
    this.setupRoutes()
    this.middlewares.post.forEach(middleware => this.app.use(middleware))
    console.info(chalk.green('▶ Routes set'))

    this.app.listen(this.config.port, () => {
      console.info(chalk.blue(`\n┌${'─'.repeat(50)}┐`))
      console.info(`${chalk.blue.bold('│ Server Info'.padEnd(51))}│`)
      console.info(chalk.blue(`├${'─'.repeat(50)}┤`))

      console.info(chalk.cyan(`${`│ ${chalk.bold('Port:'.padEnd(10))} ${String(this.config.port)}`.padEnd(60)}│`))
      console.info(chalk.cyan(`${`│ ${chalk.bold('Prefix:'.padEnd(10))} ${(this.config.prefix || '/')}`.padEnd(60)}│`))
      console.info(chalk.cyan(`${`│ ${chalk.bold('Delay:'.padEnd(10))} ${String(this.config.delay || 0)}ms`.padEnd(60)}│`))
      console.info(chalk.cyan(`${`│ ${chalk.bold('Auth:'.padEnd(10))} ${this.config.auth?.enabled ? chalk.green('Enabled') : chalk.gray('Disabled')}`.padEnd(70)}│`))

      console.info(chalk.blue(`└${'─'.repeat(50)}┘\n`))
      // 路由信息
      console.info(chalk.blue(`┌${'─'.repeat(50)}┐`))
      console.info(`${chalk.blue.bold('│ Routes Info'.padEnd(51))}│`)
      console.info(chalk.blue(`├${'─'.repeat(50)}┤`))

      this.app._router.stack.forEach((r: any, index: number) => {
        if (r.route) {
          const method = r.route.stack[0].method.toUpperCase()
          const methodLabel = `[${method}]`.padEnd(10)
          const path = r.route.path.padEnd(38)

          console.info(
            chalk.blue('│ ')
            + chalk.green.bold(`${methodLabel}`)
            + chalk.black(`${path}`)
            + chalk.blue(' │'),
          )

          const lineChar = index === this.app._router.stack.length - 1 ? '└' : '├'
          console.info(chalk.blue(`${lineChar}${'─'.repeat(50)}${lineChar === '└' ? '┘' : '┤'}`))
        }
      })

      console.info('\n')
    })
  }

  /**
   * @description Stop the mock server
   * @returns void
   */
  public async stop() {
    this.app.removeAllListeners()
  }

  /**
   * @description Setup the routes for the mock server
   * @returns void
   */
  private setupRoutes(): void {
    const prefix = this.config.prefix || ''

    this.app.get(`${prefix}/:resource`, this.handleGetList.bind(this))
    this.app.get(`${prefix}/:resource/:id`, this.handleGetOne.bind(this))
    this.app.post(`${prefix}/:resource`, this.handlePost.bind(this))
    this.app.put(`${prefix}/:resource/:id`, this.handlePut.bind(this))
    this.app.delete(`${prefix}/:resource/:id`, this.handleDelete.bind(this))
  }

  /**
   * @description Handle the GET request for a list of resources
   * @param req - The request object
   * @param res - The response object
   */
  private handleGetList(req: Request, res: Response): void {
    const { resource } = req.params
    const { current_page = 1, page_size = 10, ...query } = req.query as QueryParams

    this.logger.info(`${chalk.green('[GET]')} ${req.url}`)

    const db = this.configManager.getDatabase()
    if (!db) {
      this.logger.error(chalk.red('✗ Database not found'))
      res.status(404).json({ error: 'Database not found' })
      return
    }

    let collection = db.getModel(resource)
    if (!collection) {
      this.logger.error(chalk.red('✗ Resource not found'))
      res.status(404).json({ error: 'Resource not found' })
      return
    }

    Object.entries(query).forEach(([key, value]) => {
      const { field, operator } = getFilterOperator(key)
      if (operator) {
        collection = collection.where(field, operator, value)
      }
    })

    try {
      const data = collection.find()
      const start = (current_page - 1) * page_size
      const end = current_page * page_size
      const paginatedData = data.slice(start, end)

      const response: PaginatedResponse<any> = {
        data: paginatedData,
        pagination: {
          total: data.length,
          current_page: Number.parseInt(String(current_page)),
          per_page: Number.parseInt(String(page_size)),
          total_pages: Math.ceil(data.length / page_size),
        },
      }
      res.json(response)
    }
    catch (error) {
      this.logger.error(chalk.red('✗ Failed to get list'))
      this.logger.error(error)
      res.status(500).json({ error: 'Failed to get list' })
    }
  }

  /**
   * @description Handle the GET request for a single resource
   * @param req - The request object
   * @param res - The response object
   */
  private handleGetOne(req: Request, res: Response): void {
    const { resource, id } = req.params
    const db = this.configManager.getDatabase()
    if (!db) {
      this.logger.error(chalk.red('✗ Resource not found'))
      res.status(404).json({ error: 'Resource not found' })
      return
    }

    let collection = db.getModel(resource)
    if (!collection) {
      this.logger.error(chalk.red('✗ Resource not found'))
      res.status(404).json({ error: 'Resource not found' })
      return
    }

    const query = req.query as QueryParams

    Object.entries(query).forEach(([key, value]) => {
      const { field, operator } = getFilterOperator(key)
      if (operator) {
        collection = collection.where(field, operator, value)
      }
    })

    const item = collection.findById(id)
    if (!item) {
      this.logger.error(chalk.red('✗ Not found'))
      res.status(404).json({ error: 'Not found' })
      return
    }

    res.json(item)
  }

  /**
   * @description Handle the POST request for a single resource
   * @param req - The request object
   * @param res - The response object
   */
  private async handlePost(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { resource } = req.params

    this.logger.info(`${chalk.green('[POST]')} ${req.url} ${JSON.stringify(req.body)}`)

    const db = this.configManager.getDatabase()
    if (!db) {
      this.logger.error(chalk.red('✗ Database not found'))
      res.status(404).json({ error: 'Resource not found' })
      return
    }

    const { error, value } = this.validator.validate(resource, req.body)
    if (error) {
      this.logger.error(chalk.red('✗ Validation error'))
      this.logger.error(error.details.map(detail => detail.message).join('\n'))
      res.status(400).json({
        error: 'Validation error',
        details: error.details.map(detail => detail.message),
      })
      return
    }

    const collection = db.getModel(resource)
    if (!collection) {
      this.logger.error(chalk.red('✗ Resource not found'))
      res.status(404).json({ error: 'Resource not found' })
      return
    }

    const newItem = {
      ...value,
      createdBy: req.user?.id,
    }

    try {
      const result = collection.insert(newItem)

      res.status(200).json({
        data: result,
        message: 'Resource created successfully',
      })
    }
    catch (error) {
      this.logger.error(chalk.red('✗ Failed to create resource'))
      this.logger.error(error)
      res.status(500).json({ error: 'Failed to create resource' })
    }
  }

  /**
   * @description Handle the PUT request
   * @param req - The request object
   * @param res - The response object
   */
  private async handlePut(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { resource, id } = req.params

    this.logger.info(`${chalk.green('[PUT]')} ${req.url} ${JSON.stringify(req.body)}`)

    const db = this.configManager.getDatabase()
    if (!db) {
      this.logger.error(chalk.red('✗ Resource not found'))
      res.status(404).json({ error: 'Resource not found' })
      return
    }

    let collection = db.getModel(resource)
    if (!collection) {
      this.logger.error(chalk.red('✗ Resource not found'))
      res.status(404).json({ error: 'Resource not found' })
      return
    }

    const query = req.query as QueryParams

    Object.entries(query).forEach(([key, value]) => {
      const { field, operator } = getFilterOperator(key)
      if (operator) {
        collection = collection.where(field, operator, value)
      }
    })
    const { error, value } = this.validator.validate(resource, req.body)
    if (error) {
      this.logger.error(chalk.red('✗ Validation error'))
      this.logger.error(error.details.map(detail => detail.message).join('\n'))
      res.status(400).json({
        error: 'Validation error',
        details: error.details.map(detail => detail.message),
      })
      return
    }

    try {
      const result = collection.updateById(id, { ...value, updatedAt: Date.now() })
      res.json(result)
    }
    catch (error) {
      this.logger.error(chalk.red('✗ Failed to update resource'))
      this.logger.error(error)
      res.status(500).json({ error: 'Failed to update resource' })
    }
  }

  /**
   * @description Handle the DELETE request
   * @param req - The request object
   * @param res - The response object
   */
  private async handleDelete(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { resource, id } = req.params

    this.logger.info(`${chalk.green('[DELETE]')} ${req.url}`)

    const db = this.configManager.getDatabase()
    if (!db) {
      this.logger.error(chalk.red('✗ Resource not found'))
      res.status(404).json({ error: 'Resource not found' })
      return
    }

    let collection = db.getModel(resource)
    if (!collection) {
      this.logger.error(chalk.red('✗ Resource not found'))
      res.status(404).json({ error: 'Resource not found' })
      return
    }

    const query = req.query as QueryParams

    Object.entries(query).forEach(([key, value]) => {
      const { field, operator } = getFilterOperator(key)
      if (operator) {
        collection = collection.where(field, operator, value)
      }
    })

    try {
      const item = collection.findById(id)
      if (!item) {
        this.logger.error(chalk.red('✗ Not found'))
        res.status(404).json({ error: 'Not found' })
        return
      }

      if (this.config.auth?.enabled && item.createdBy !== req.user?.id) {
        this.logger.error(chalk.red('✗ Permission denied'))
        res.status(403).json({ error: 'Permission denied' })
        return
      }

      collection.delete()

      res.status(204).end()
    }
    catch (error) {
      this.logger.error(chalk.red('✗ Failed to delete resource'))
      this.logger.error(error)
      res.status(500).json({ error: 'Failed to delete resource' })
    }
  }

  /**
   * @description Add a custom route to the mock server
   * @param method - The method to add
   * @param path - The path to add
   * @param handler - The handler to add
   * @returns this
   */
  public addCustomRoute(
    method: 'get' | 'post' | 'put' | 'delete' | 'patch' | 'all' | 'options' | 'head',
    path: string,
    handler: (req: Request, res: Response) => void,
  ): this {
    const methodName = method
    this.app[methodName](`${this.config.prefix}${path}`, handler)
    return this
  }

  /**
   * @description Get the express app
   * @returns The express app
   */
  public getApp(): Express {
    return this.app
  }

  /**
   * @description Add a validation schema to the validator
   * @param resource - The resource to add the schema to
   * @param schema - The schema to add
   * @returns this
   */
  public addValidation(resource: string, schema: ValidationSchema): this {
    this.validator.addSchema(resource, schema)
    return this
  }

  /**
   * @description Generate a token
   * @param payload - The payload to generate the token from
   * @returns The generated token
   */
  public generateToken(payload: object): string {
    return this.auth.generateToken(payload)
  }
}

export * from './db'
export * from './types'

export default MockServer
