# Jsonx Mock

A TypeScript-based Mock REST API Server with integrated authentication and validation. Perfect for rapid API prototyping and development.

## Features

- 🚀 **Auto-generated REST endpoints**
- 🔒 **JWT Authentication middleware**
- ✅ **Data validation** with Joi schemas
- ⚡ **Dual usage mode** (CLI & Programmatic)
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

## CLI Usage

### Quick Start
```bash
jsonx-mock --port 3000 --db-storage ./data/db.json --db-model ./models
```

### Command Options
| Option               | Description                          | Default Value     |
|----------------------|--------------------------------------|-------------------|
| `-p, --port <port>`  | Set server port                      | 3000              |
| `-d, --delay <ms>`   | Add response delay in milliseconds   | 0                 |
| `--db-storage <path>`| Path to database storage file        | Required          |
| `--db-model <path>`  | Path to model definitions directory  | Required          |
| `--help`             | Show help menu                       | -                 |

### Configuration File

Supports multiple configuration file formats (loaded by priority):

```ts
// mock.config.ts
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

## Programmatic Usage

### Basic Setup

```ts
import MockServer from 'jsonx-mock'

const server = new MockServer({
  port: 3000,
  dbStoragePath: './data/db.json',
  dbModelPath: './models',
  auth: {
    enabled: true,
    secret: 'your-secret-key'
  }
})

server.start()
```

### Advanced Configuration

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

### Custom Extensions
```ts
// Add validation rules
server.addValidation('users', {
  name: Joi.string().required(),
  email: Joi.string().email().required()
})

// Add custom routes
server.addCustomRoute('get', '/system/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() })
})

// Add middleware
server.pre((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
  next()
})
```

## Core Functionality

### Auto-generated Endpoints
| Method | Endpoint              | Description          |
|--------|-----------------------|----------------------|
| GET    | /api/:resource       | List resources       |
| GET    | /api/:resource/:id   | Get single resource  |
| POST   | /api/:resource       | Create resource      |
| PUT    | /api/:resource/:id   | Update resource      |
| DELETE | /api/:resource/:id   | Delete resource      |

### Authentication Flow
```ts
// Generate access token
app.post('/auth/login', (req, res) => {
  const token = server.generateToken({
    userId: 123,
    role: 'admin'
  })
  res.json({ token })
})

// Protected endpoint example
app.get('/user/profile', (req, res) => {
  const user = req.user // Parsed from JWT
  res.json({
    id: user.id,
    name: 'Test User'
  })
})
```

## License

[Apache-2.0](./LICENSE)
