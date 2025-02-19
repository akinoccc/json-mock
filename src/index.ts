import type { Express, NextFunction, Request, Response } from 'express'
import type e from 'express'
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
import Service from './service'
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
    this.config = config

    this.app = express()
    this.configManager = new Service(this.config)
    this.validator = new Validator()
    this.auth = new Auth(this.config.auth)
    this.middlewares = {
      pre: [],
      post: [],
    }
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
    console.log(chalk.cyan('\n=== Initializing server ===\n'))
    await this.configManager.initialize()
    console.log(chalk.green('✓ Config manager initialized'))

    this.setupMiddlewares()
    console.log(chalk.green('✓ Middlewares set'))

    this.middlewares.pre.forEach(middleware => this.app.use(middleware))
    this.setupRoutes()
    this.middlewares.post.forEach(middleware => this.app.use(middleware))
    console.log(chalk.green('✓ Routes set'))

    this.app.listen(this.config.port, () => {
      console.log(chalk.cyan('\n=== Server information ===\n'))
      console.log(chalk.green(`✓ Server running on port: ${chalk.yellow(this.config.port)}`))
      console.log(chalk.green(`✓ API prefix: ${chalk.yellow(this.config.prefix || '/')}`))
      console.log(chalk.green(`✓ Response delay: ${chalk.yellow(this.config.delay || 0)} ms`))
      console.log(chalk.green(`✓ Authentication status: ${this.config.auth?.enabled ? chalk.green('Enabled') : chalk.red('Disabled')}\n`))

      // 打印所有路由信息
      console.log(chalk.cyan('\n=== Registered Routes ===\n'))
      this.app._router.stack.forEach((r: any) => {
        if (r.route && r.route.path) {
          const methods = Object.keys(r.route.methods)
            .filter(method => method !== '_all')
            .map(method => chalk.yellow(method.toUpperCase()))
            .join(', ')

          console.log(
            `${chalk.green('→')} ${methods} ${chalk.blue(r.route.path)}`,
          )
        }
      })
      console.log(chalk.cyan('\n=========================\n'))
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

    console.log(chalk.cyan(`\n[GET] ${resource} list request`))
    console.log(chalk.gray(`Parameters: ${JSON.stringify({ current_page, page_size, ...query }, null, 2)}`))

    const db = this.configManager.getDatabase()
    if (!db) {
      console.log(chalk.red('✗ Database not found'))
      res.status(404).json({ error: 'Resource not found' })
      return
    }

    let collection = db.getModel(resource)
    if (!collection) {
      res.status(404).json({ error: 'Resource not found' })
      return
    }

    Object.entries(query).forEach(([key, value]) => {
      collection = collection.where(key, '=', value)
    })

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

  /**
   * @description Handle the GET request for a single resource
   * @param req - The request object
   * @param res - The response object
   */
  private handleGetOne(req: Request, res: Response): void {
    const { resource, id } = req.params
    const db = this.configManager.getDatabase()
    if (!db) {
      console.log(chalk.red('Resource not found'))
      res.status(404).json({ error: 'Resource not found' })
      return
    }

    const item = db.getModel(resource)?.findById(id)
    if (!item) {
      console.log(chalk.red('Not found'))
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

    console.log(chalk.cyan(`\n[POST] Create ${resource}`))
    console.log(chalk.gray(`Data: ${JSON.stringify(req.body, null, 2)}`))

    const db = this.configManager.getDatabase()
    if (!db) {
      console.log(chalk.red('✗ Database not found'))
      res.status(404).json({ error: 'Resource not found' })
      return
    }

    const { error, value } = this.validator.validate(resource, req.body)
    if (error) {
      console.log(chalk.red('✗ Validation error'))
      console.log(chalk.red(error.details.map(detail => detail.message).join('\n')))
      res.status(400).json({
        error: 'Validation error',
        details: error.details.map(detail => detail.message),
      })
      return
    }

    const collection = db.getModel(resource)
    if (!collection) {
      console.log(chalk.red('Resource not found'))
      res.status(404).json({ error: 'Resource not found' })
      return
    }

    const newItem = {
      ...value,
      createdBy: req.user?.id,
    }

    const result = collection.insert(newItem)

    res.status(200).json({
      data: result,
      message: 'Resource created successfully',
    })
  }

  /**
   * @description Handle the PUT request
   * @param req - The request object
   * @param res - The response object
   */
  private async handlePut(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { resource, id } = req.params

    console.log(chalk.cyan(`\n[PUT] Update ${resource}/${id}`))
    console.log(chalk.gray(`Data: ${JSON.stringify(req.body, null, 2)}`))

    const db = this.configManager.getDatabase()
    if (!db) {
      console.log(chalk.red('Resource not found'))
      res.status(404).json({ error: 'Resource not found' })
      return
    }

    const { error, value } = this.validator.validate(resource, req.body)
    if (error) {
      res.status(400).json({
        error: 'Validation error',
        details: error.details.map(detail => detail.message),
      })
      return
    }

    const collection = db.getModel(resource)
    if (!collection) {
      console.log(chalk.red('Resource not found'))
      res.status(404).json({ error: 'Resource not found' })
      return
    }

    const result = collection.updateById(id, { ...value, updatedAt: Date.now() })

    res.json(result)
  }

  /**
   * @description Handle the DELETE request
   * @param req - The request object
   * @param res - The response object
   */
  private async handleDelete(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { resource, id } = req.params

    console.log(chalk.cyan(`\n[DELETE] Delete ${resource}/${id}`))

    const db = this.configManager.getDatabase()
    if (!db) {
      console.log(chalk.red('Resource not found'))
      res.status(404).json({ error: 'Resource not found' })
      return
    }

    const collection = db.getModel(resource)
    if (!collection) {
      console.log(chalk.red('Resource not found'))
      res.status(404).json({ error: 'Resource not found' })
      return
    }

    const item = collection.findById(id)
    if (!item) {
      console.log(chalk.red('Not found'))
      res.status(404).json({ error: 'Not found' })
      return
    }

    if (this.config.auth?.enabled && item.createdBy !== req.user?.id) {
      console.log(chalk.red('Permission denied'))
      res.status(403).json({ error: 'Permission denied' })
      return
    }

    collection.delete()

    res.status(204).end()
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

export default MockServer
