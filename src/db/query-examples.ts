import { JsonDB } from './index'

const db = new JsonDB('./data.json')
const users = db.collection('users')

// 添加一些测试数据
users.insert([
  { name: '张三', age: 25, tags: ['开发', '前端'], email: 'zhang@example.com' },
  { name: '李四', age: 30, tags: ['设计', 'UI'], email: 'li@example.com' },
  { name: '王五', age: 28, tags: ['后端', '运维'], email: 'wang@example.com' },
])

// 使用 in 操作符
const developers = users
  .where('age', 'in', [25, 28])
  .find()

// 使用 not-in 操作符
const nonDesigners = users
  .where('tags', 'not-in', ['设计'])
  .find()

// 使用 contains 操作符搜索标签
const frontendDevs = users
  .where('tags', 'contains', '前端')
  .find()

// 使用 starts-with 操作符搜索邮箱
const zhangUsers = users
  .where('email', 'starts-with', 'zhang')
  .find()

// 使用 ends-with 操作符
const exampleDomainUsers = users
  .where('email', 'ends-with', '@example.com')
  .find()

// 使用 exists 操作符检查字段是否存在
const usersWithTags = users
  .where('tags', 'exists', true)
  .find()

// 组合多个条件
const result = users
  .where('age', '>=', 25)
  .where('tags', 'contains', '开发')
  .where('email', 'ends-with', '@example.com')
  .find()
