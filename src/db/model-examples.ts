import { AutoIncrement, Field, Model } from './decorators'
import { JsonDB } from './JsonDB'

@Model()
class User {
  @AutoIncrement()
  @Field({ type: 'number' })
  id!: number

  @Field({ type: 'string', required: true, min: 2, max: 50 })
  name!: string

  @Field({ type: 'number', min: 0, max: 150 })
  age?: number

  @Field({ type: 'string', enum: ['user', 'admin'] })
  role?: string

  @Field({ type: 'array' })
  tags?: string[]

  @Field({ type: 'date' })
  createdAt?: Date
}

@Model({ name: 'posts' })
class Post {
  @AutoIncrement()
  @Field({ type: 'number' })
  id!: number

  @Field({ type: 'string', required: true })
  title!: string

  @Field({ type: 'string' })
  content?: string

  @Field({ type: 'number', ref: 'users' })
  authorId!: number

  @Field({ type: 'date', default: () => new Date() })
  createdAt!: Date
}

const db = new JsonDB('./data.json')

// 注册模型
const Users = db.registerModel(User)
const Posts = db.registerModel(Post)

// 使用模型
Users.insert({
  name: '张三',
  age: 25,
  role: 'user',
  tags: ['前端', '开发'],
  createdAt: new Date(),
})

Posts.insert({
  title: '第一篇文章',
  content: '这是内容...',
  authorId: 1,
})

// 关联查询
const userPosts = Posts
  .where('authorId', '==', 1)
  .populate('authorId', {
    from: Users,
    localField: 'authorId',
    foreignField: 'id',
  })
