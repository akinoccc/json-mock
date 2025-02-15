import { JsonDB } from './index'

const db = new JsonDB('./data.json')
const users = db.collection('users')
const posts = db.collection('posts')

// 使用事务进行批量操作
await users.transaction(async (collection) => {
  await collection.insertMany([
    { name: '张三', age: 25, role: 'user' },
    { name: '李四', age: 30, role: 'admin' },
  ])

  await collection.where('role', '==', 'user')
    .update({ status: 'active' })
})

// 使用聚合管道
const result = users.aggregate([
  {
    $match: { age: { $gt: 25 } },
  },
  {
    $sort: { age: -1 },
  },
  {
    $group: {
      _id: item => item.role,
      count: { $sum: 1 },
      avgAge: { $avg: 'age' },
    },
  },
])

// 使用关联查询
const userPosts = users
  .where('role', '==', 'admin')
  .populate('posts', {
    from: posts,
    localField: 'id',
    foreignField: 'userId',
  })

// 使用索引优化查询
const ageIndex = users.createIndex('age', { unique: false })
const usersByAge = ageIndex.get(25) // 快速查找年龄为 25 的用户

// 保存单个文档
const user = users.findOne()
if (user) {
  user.lastLogin = new Date()
  users.save(user)
}

// 使用复杂的聚合查询
const stats = users.aggregate([
  {
    $match: {
      age: { $gt: 20 },
      role: { $in: ['user', 'admin'] },
    },
  },
  {
    $group: {
      _id: item => item.role,
      total: { $sum: 1 },
      avgAge: { $avg: 'age' },
      names: (items: Array<{ name: string }>) => items.map(i => i.name),
    },
  },
  { $sort: { total: -1 } },
  { $limit: 5 },
])
