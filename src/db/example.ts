import { JsonDB } from './index'

const db = new JsonDB('./data.json')

// 插入数据
db.collection('users')
  .insert({ name: '张三', age: 25 })

// 查询数据
const users = db.collection('users')
  .where('age', '>', 20)
  .where('name', '==', '张三')
  .find()

// 更新数据
db.collection('users')
  .where('name', '==', '张三')
  .update({ age: 26 })

// 删除数据
db.collection('users')
  .where('name', '==', '张三')
  .delete()
