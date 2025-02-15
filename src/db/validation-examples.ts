import { JsonDB } from './index'

const db = new JsonDB('./data.json')
const users = db.collection('users')

// 设置验证规则
users.setValidator({
  name: {
    type: 'string',
    required: true,
    min: 2,
    max: 50,
  },
  age: {
    type: 'number',
    required: true,
    min: 0,
    max: 150,
  },
  email: {
    type: 'string',
    required: true,
    pattern: /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/,
  },
  role: {
    type: 'string',
    enum: ['user', 'admin', 'guest'],
  },
  tags: {
    type: 'array',
    max: 5,
  },
  active: {
    type: 'boolean',
  },
  birthday: {
    type: 'date',
  },
  profile: {
    type: 'object',
  },
  // 自定义验证
  password: {
    type: 'string',
    required: true,
    custom: (value: string) => {
      if (!/[A-Z]/.test(value))
        return '密码必须包含至少一个大写字母'
      if (!/\d/.test(value))
        return '密码必须包含至少一个数字'
      if (value.length < 8)
        return '密码长度不能小于8位'
      return true
    },
  },
})

try {
  // 插入有效数据
  users.insert({
    name: '张三',
    age: 25,
    email: 'zhang@example.com',
    role: 'user',
    tags: ['前端', '开发'],
    active: true,
    birthday: new Date('1998-01-01'),
    profile: { city: '北京' },
    password: 'Password123',
  })

  // 这将抛出错误
  users.insert({
    name: 'x', // 太短
    age: 200, // 超出范围
    email: 'invalid-email', // 无效的邮箱格式
    role: 'superadmin', // 不在枚举值中
    tags: ['1', '2', '3', '4', '5', '6'], // 数组太长
    password: 'weakpass', // 不符合密码规则
  })
}
catch (error: any) {
  console.error(error.message)
}
