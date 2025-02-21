import type e from 'express'
import { rm } from 'node:fs/promises'
import Joi from 'joi'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import MockServer from '../src/index'
import { getRandomPort, getRandomString } from './util'

/**
 * Test mock server CURD
 */
describe('mock server', () => {
  let server: MockServer
  let app: e.Express
  const alreadyUsedPorts: number[] = []
  const dbStoragePath = new URL(`./data-${getRandomString()}.json`, import.meta.url).pathname

  beforeEach(async () => {
    let port = getRandomPort()
    while (alreadyUsedPorts.includes(port)) {
      port = getRandomPort()
    }
    alreadyUsedPorts.push(port)

    server = new MockServer({
      port,
      delay: 0,
      prefix: '/api',
      dbStoragePath,
      dbModelPath: new URL('./models.ts', import.meta.url).pathname,
    })

    await server.start()
    app = server.getApp()

    await request(app)
      .post('/api/users')
      .send({
        id: 1,
        name: 'John Doe',
        email: 'john.doe@example.com',
      })

    await request(app)
      .post('/api/users')
      .send({
        id: 2,
        name: 'Jane Doe',
        email: 'jane.doe@example.com',
      })

    await request(app)
      .post('/api/posts')
      .send({
        id: 1,
        title: 'Post 1',
        content: 'Content 1',
        authorId: 1,
      })

    await request(app)
      .post('/api/posts')
      .send({
        id: 2,
        title: 'Post 2',
        content: 'Content 2',
        authorId: 2,
      })
  })

  afterEach(async () => {
    server.stop()
    await rm(dbStoragePath)
  })

  describe('curd', () => {
    it('should create server instance', async () => {
      expect(app).toBeTruthy()
    })

    it('should handle GET request and return paginated data', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(200)

      expect(response.body.data).toBeInstanceOf(Array)
      expect(response.body.pagination).toMatchObject({
        total: expect.any(Number),
        current_page: expect.any(Number),
        per_page: expect.any(Number),
        total_pages: expect.any(Number),
      })
    })

    it('should handle POST request and return created data', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          name: 'John Doe',
          email: 'john.doe@example.com',
        })
        .expect(200)

      expect(response.body.data).toMatchObject({
        id: expect.any(String),
        name: 'John Doe',
        email: 'john.doe@example.com',
      })
    })

    it('should handle PUT request and return updated data', async () => {
      const createResponse = await request(app)
        .post('/api/users')
        .send({
          name: 'John Doe',
          email: 'john.doe@example.com',
        })

      const userId = createResponse.body.data.id

      const response = await request(app)
        .put(`/api/users/${userId}`)
        .send({
          name: 'John Doe Updated',
        })
        .expect(200)

      expect(response.body).toMatchObject({
        id: userId,
        name: 'John Doe Updated',
        email: 'john.doe@example.com',
      })
    })

    it('should handle DELETE request', async () => {
      const createResponse = await request(app)
        .post('/api/users')
        .send({
          name: 'John Doe',
          email: 'john.doe@example.com',
        })

      const userId = createResponse.body.data.id

      await request(app)
        .delete(`/api/users/${userId}`)
        .expect(204)

      await request(app)
        .get(`/api/users/${userId}`)
        .expect(404)
    })
  })

  /**
   * Test data validator
   */
  describe('data validator', () => {
    it('should validate request parameters', async () => {
      server.addValidation('users', {
        name: Joi.string().required(),
        email: Joi.string().email(),
      })

      const response = await request(app)
        .post('/api/users')
        .send({
          email: 'invalid-email',
        })
        .expect(400)

      expect(response.body.error).toBe('Validation error')
      expect(response.body.details).toBeInstanceOf(Array)
    })
  })

  /**
   * Test custom route
   */
  describe('custom route', () => {
    it('should handle custom route', async () => {
      const customServer = new MockServer({
        port: getRandomPort(),
        dbStoragePath: new URL('./data.json', import.meta.url).pathname,
        dbModelPath: new URL('./models.ts', import.meta.url).pathname,
        prefix: '/api',
      })

      customServer.addCustomRoute('get', '/custom', (_, res) => {
        res.json({ message: 'Custom route' })
      })

      await customServer.start()

      const customApp = customServer.getApp()
      const response = await request(customApp)
        .get('/api/custom')
        .expect(200)

      expect(response.body.message).toBe('Custom route')
    })
  })

  /**
   * Test middleware
   */
  describe('middleware', () => {
    let middlewareServer: MockServer
    let middlewareApp: e.Express
    const middlewareDbStoragePath = new URL(`./data-${getRandomString()}.json`, import.meta.url).pathname

    beforeEach(async () => {
      middlewareServer = new MockServer({
        port: getRandomPort(),
        dbStoragePath: middlewareDbStoragePath,
        dbModelPath: new URL('./models.ts', import.meta.url).pathname,
        prefix: '/api',
      })
      middlewareApp = middlewareServer.getApp()
    })

    afterEach(async () => {
      await rm(middlewareDbStoragePath)
    })

    it('should handle pre middleware', async () => {
      middlewareServer.pre((req, _, next) => {
        req.query.page_size = '1'
        next()
      })

      await middlewareServer.start()

      await request(middlewareApp)
        .post('/api/users')
        .send({
          name: 'John Doe',
          email: 'john.doe@example.com',
        })

      await request(middlewareApp)
        .post('/api/users')
        .send({
          name: 'Jane Doe',
          email: 'jane.doe@example.com',
        })

      const response = await request(middlewareApp)
        .get('/api/users')
        .expect(200)

      expect(response.body.data.length).toBe(1)
    })

    it('should handle post middleware', async () => {
      middlewareServer.post((req, res) => {
        res.status(200).json({
          message: 'Middleware response',
          data: [
            {
              id: 1,
              name: 'John Doe',
              email: 'john.doe@example.com',
            },
          ],
        })
      })

      await middlewareServer.start()

      const response = await request(middlewareApp)
        .get('/api/users')
        .expect(200)

      expect(response.body.data).toBeTruthy()
    })
  })

  /**
   * Test auth
   */
  describe('auth', () => {
    let authServer: MockServer
    let authApp: e.Express
    const authDbStoragePath = new URL(`./data-${getRandomString()}.json`, import.meta.url).pathname

    beforeEach(async () => {
      authServer = new MockServer({
        port: getRandomPort(),
        dbStoragePath: authDbStoragePath,
        dbModelPath: new URL('./models.ts', import.meta.url).pathname,
        prefix: '/api',
        auth: {
          enabled: true,
          secret: 'test-secret',
        },
      })
      await authServer.start()
      authApp = authServer.getApp()
    })

    afterEach(async () => {
      await rm(authDbStoragePath)
    })

    it('should handle token validation', async () => {
      await request(authApp)
        .post('/api/users')
        .send({
          name: 'John Doe',
          email: 'john.doe@example.com',
        })
        .expect(401)
    })

    it('should handle token validation with valid token', async () => {
      const response = await request(authApp)
        .post('/api/users')
        .send({
          name: 'John Doe',
          email: 'john.doe@example.com',
        })
        .set('Authorization', `Bearer ${authServer.generateToken({ id: 1, name: 'John Doe' })}`)
        .expect(200)

      expect(response.body.data).toBeTruthy()
    })
  })
})
