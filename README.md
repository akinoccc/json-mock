# Jsonx Mock

A flexible and feature-rich mock server built with Express.js for rapid API development and testing.

## Features

- 🚀 Quick setup with minimal configuration
- 📦 Support for JSON file-based data storage
- 🔒 Built-in authentication support
- ✨ Request validation using Joi
- 📝 Automatic CRUD endpoints
- 🎯 Custom route support
- ⏱️ Configurable response delays
- 📄 Pagination support
- 🔍 Query parameter filtering

```bash
pnpm i jsonx-mock@latest
```

```typescript
import MockServer from 'jsonx-mock'
const server = new MockServer({
  port: 3000,
  dbPath: './db.json'
})
server.start()
```

```bash
json-mock --port 3000 --db ./db.json
```

Options:
- `-p, --port`: Set server port (default: 3000)
- `-d, --delay`: Set response delay in milliseconds
- `--db`: Specify db.json file path
- `--api`: Specify API folder path

## Configuration

```typescript
const config = {
  port: 3000,
  delay: 1000,
  prefix: '/api',
  dbPath: './db.json',
  auth: {
    enabled: true,
    secret: 'your-secret-key',
    expiresIn: '1h',
    excludePaths: ['/api/login']
  }
}
const server = new MockServer(config)
```

## Authentication

Enable authentication with JWT:

```typescript
const server = new MockServer({
  auth: {
    enabled: true,
    secret: 'your-secret-key'
  }
})
// Generate token
const token = server.generateToken({ userId: 1 })
```

## Validation

Add validation schemas for your resources:

```typescript
import Joi from 'joi'
server.addValidation('users', {
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  age: Joi.number().min(0)
})
```

## Custom Routes

Add custom routes to handle specific cases:

```typescript
server.addCustomRoute('get', '/custom', (req, res) => {
  res.json({ message: 'Custom route response' })
})
```

## Middleware Support

Add pre and post processing middleware:

```typescript
server.pre((req, res, next) => {
  console.log('Pre-processing middleware')
  next()
})
server.post((req, res, next) => {
  console.log('Post-processing middleware')
  next()
})
```

## API Endpoints

The server automatically creates the following REST endpoints:

- `GET /:resource` - Get a list of resources
- `GET /:resource/:id` - Get a single resource
- `POST /:resource` - Create a new resource
- `PUT /:resource/:id` - Update a resource
- `DELETE /:resource/:id` - Delete a resource

### Query Parameters

List endpoints support the following query parameters:
- `current_page`: Page number for pagination
- `page_size`: Number of items per page
- Any other field name for filtering

## License

[Apache-2.0](./LICENSE)
