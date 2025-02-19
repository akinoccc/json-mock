# Jsonx Mock

A TypeScript-based Mock REST API Server with integrated authentication and validation. Perfect for rapid API prototyping and development.

## Features

- 🚀 **Auto-generated REST endpoints**
- 🔒 **JWT Authentication middleware**
- ✅ **Data validation** with Joi schemas
- ⚡ **Zero-config CLI support**
- 📊 **Built-in pagination**
- ⏱️ **Configurable response delays**
- 🛠️ **Custom route support**

## Installation

```bash
npm install jsonx-mock --save-dev
# or
yarn add jsonx-mock -D
# or
pnpm add jsonx-mock -D
```

## Quick Start

1. Create basic configuration (`mock.config.{ts,mts,cts,js,mjs,cjs,json}`):

```ts
export default {
  port: 3000,
  dbStoragePath: './data/db.json',
  dbModelPath: './models',
  auth: {
    enabled: true,
    secret: 'your-secret-key',
    expiresIn: '1h'
  }
}
```

2. Start the server:

```bash
jsonx-mock --port 3000
```

## Core Functionality

### Auto-generated Endpoints
The server automatically creates RESTful endpoints for your resources:

| Method | Endpoint              | Description          |
|--------|-----------------------|----------------------|
| GET    | /api/:resource       | List resources       |
| GET    | /api/:resource/:id   | Get single resource  |
| POST   | /api/:resource       | Create resource      |
| PUT    | /api/:resource/:id   | Update resource      |
| DELETE | /api/:resource/:id   | Delete resource      |

### Authentication Setup
```ts
// Generate JWT token
app.post('/login', (req, res) => {
  const token = server.generateToken({ userId: 123 })
  res.json({ token })
})

// Protected endpoint
app.get('/profile', (req, res) => {
  const user = req.user // From JWT
  res.json(user)
})
```

### Data Validation
```ts
server.addValidation('users', {
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  age: Joi.number().min(18)
})
```

## Configuration Options

```ts
interface Config {
  port?: number // Server port (default: 3000)
  delay?: number // Response delay in milliseconds
  prefix?: string // API path prefix
  dbStoragePath: string // Path to database storage file
  dbModelPath: string // Path to model definitions
  auth?: {
    enabled: boolean // Enable JWT authentication
    secret: string // JWT signing secret
    expiresIn?: string // Token expiration time
    excludePaths?: string[]// Public endpoints
  }
}
```

## CLI Usage

```bash
mock-server [options]

Options:
  -p, --port <port>        Set server port (default: 3000)
  -d, --delay <ms>         Add response delay in milliseconds
  --db-storage <path>      Path to database storage file
  --db-model <path>        Path to model definitions
  --help                   Show help
```

## Advanced Features

### Custom Routes
```ts
server.addCustomRoute('get', '/health', (req, res) => {
  res.json({ status: 'ok' })
})
```

### Middleware Hooks
```ts
// Pre-processing middleware
server.pre((req, res, next) => {
  console.log('Request received:', req.method, req.path)
  next()
})

// Post-processing middleware
server.post((req, res, next) => {
  console.log('Response sent:', res.statusCode)
  next()
})
```

## License

[Apache-2.0](./LICENSE)
