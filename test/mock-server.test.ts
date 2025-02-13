import Joi from 'joi'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import MockServer from '../src/index'
import { getRandomPort } from './util'

/**
 * Test mock server CURD
 */
describe('mockServer CURD Test', () => {
  it('should create server instance', async () => {
    const server = new MockServer({
      port: getRandomPort(),
      delay: 0,
      prefix: '/api',
    })

    const app = server.getApp()
    expect(app).toBeTruthy()
  })

  it('should handle GET requests and return paginated data', async () => {
    const server = new MockServer({
      port: getRandomPort(),
      dbPath: new URL('./fixtures/db.json', import.meta.url).pathname,
      prefix: '/api',
    })

    await server.start()

    const app = server.getApp()
    const response = await request(app)
      .get('/api/users')
      .expect(200)

    expect(response.body.data).toBeTruthy()
    expect(response.body.pagination).toBeTruthy()
  })

  it('should handle POST requests and return created data', async () => {
    const server = new MockServer({
      port: getRandomPort(),
      dbPath: new URL('./fixtures/db.json', import.meta.url).pathname,
      prefix: '/api',
    })

    await server.start()

    const app = server.getApp()
    const response = await request(app)
      .post('/api/users')
      .send({
        id: Date.now(),
        name: 'John Doe',
        email: 'john.doe@example.com',
      })
      .expect(200)

    expect(response.body.data).toBeTruthy()
  })

  it('should handle PUT requests and return updated data', async () => {
    const server = new MockServer({
      port: getRandomPort(),
      dbPath: new URL('./fixtures/db.json', import.meta.url).pathname,
      prefix: '/api',
    })

    await server.start()

    const app = server.getApp()
    await request(app)
      .put('/api/users/2')
      .send({
        name: 'John Doe Updated',
      })
      .expect(200)
  })

  it('should handle DELETE requests and return deleted data', async () => {
    const server = new MockServer({
      port: getRandomPort(),
      dbPath: new URL('./fixtures/db.json', import.meta.url).pathname,
      prefix: '/api',
    })

    await server.start()

    const app = server.getApp()

    // Add a new data for testing
    const response = await request(app)
      .post('/api/users')
      .send({
        id: Date.now(),
        name: 'John Doe',
        email: 'john.doe@example.com',
      })
      .expect(200)

    await request(app)
      .delete(`/api/users/${response.body.data.id}`)
      .expect(204)
  })
})

/**
 * Test token validation
 */
describe('token Validation Test', () => {
  it('should handle token validation', async () => {
    const server = new MockServer({
      port: getRandomPort(),
      dbPath: new URL('./fixtures/db.json', import.meta.url).pathname,
      prefix: '/api',
      auth: {
        enabled: true,
        secret: 'test-secret',
      },
    })

    await server.start()

    const app = server.getApp()
    await request(app)
      .post('/api/users')
      .send({
        name: 'John Doe',
        email: 'john.doe@example.com',
      })
      .expect(401)
  })

  it('should handle token validation with valid token', async () => {
    const server = new MockServer({
      port: getRandomPort(),
      dbPath: new URL('./fixtures/db.json', import.meta.url).pathname,
      prefix: '/api',
      auth: {
        enabled: true,
        secret: 'test-secret',
      },
    })

    await server.start()

    const app = server.getApp()
    const response = await request(app)
      .post('/api/users')
      .send({
        name: 'John Doe',
        email: 'john.doe@example.com',
      })
      .set('Authorization', `Bearer ${server.generateToken({ id: 1, name: 'John Doe' })}`)
      .expect(200)

    expect(response.body.data).toBeTruthy()
  })
})

/**
 * Test data validator
 */
describe('parameter Validation Test', () => {
  it('should handle parameter validation', async () => {
    const server = new MockServer({
      port: getRandomPort(),
      dbPath: new URL('./fixtures/db.json', import.meta.url).pathname,
      prefix: '/api',
    })

    server.addValidation('users', {
      name: Joi.string().required(),
      email: Joi.string().email(),
    })

    await server.start()

    const app = server.getApp()
    const response = await request(app)
      .post('/api/users')
      .send({
        email: 'invalid-email',
      })
      .expect(400)

    expect(response.body.error).toBeTruthy()
  })
})

/**
 * Test custom route
 */
describe('custom route Test', () => {
  it('should handle custom route', async () => {
    const server = new MockServer({
      port: getRandomPort(),
      dbPath: new URL('./fixtures/db.json', import.meta.url).pathname,
      prefix: '/api',
    })

    server.addCustomRoute('get', '/comments/:id', (req, res) => {
      res.status(200).json({
        message: 'Custom route response',
      })
    })

    await server.start()

    const app = server.getApp()
    const response = await request(app)
      .get('/api/comments/1')
      .expect(200)

    expect(response.body.message).toBe('Custom route response')
  })
})

/**
 * Test middleware
 */
describe('middleware Test', () => {
  it('should handle pre middleware', async () => {
    const server = new MockServer({
      port: getRandomPort(),
      dbPath: new URL('./fixtures/db.json', import.meta.url).pathname,
      prefix: '/api',
    })

    server.pre((req, _, next) => {
      req.query.page_size = '1'
      next()
    })

    await server.start()

    const app = server.getApp()
    const response = await request(app)
      .get('/api/users')
      .expect(200)

    console.log(response.body)
    expect(response.body.data.length).toBe(1)
  })

  it('should handle post middleware', async () => {
    const server = new MockServer({
      port: getRandomPort(),
      dbPath: new URL('./fixtures/db.json', import.meta.url).pathname,
      prefix: '/api',
    })

    server.post((req, res) => {
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

    await server.start()

    const app = server.getApp()
    const response = await request(app)
      .post('/api/users')
      .expect(200)

    expect(response.body.data).toBeTruthy()
  })
})
