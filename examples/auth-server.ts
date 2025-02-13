import Joi from 'joi'
import MockServer from '../src/index'

const server = new MockServer({
  port: 3000,
  dbPath: 'db.json',
  auth: {
    enabled: true,
    secret: 'your-secret-key',
    excludePaths: ['/api/login', '/api/register'],
  },
})

// 添加用户验证规则
server.addValidation('users', {
  username: Joi.string().required().min(3),
  password: Joi.string().required().min(6),
  email: Joi.string().email().required(),
})

// 添加文章验证规则
server.addValidation('posts', {
  title: Joi.string().required().min(5),
  content: Joi.string().required().min(10),
  tags: Joi.array().items(Joi.string()),
})

// 添加登录路由
server.addCustomRoute('post', '/api/login', (req, res) => {
  const { username, password } = req.body

  if (username === 'admin' && password === '123456') {
    const token = server.generateToken({ id: 1, username })
    res.json({ token })
  }
  else {
    res.status(401).json({ error: 'Invalid credentials' })
  }
})

server.start()
