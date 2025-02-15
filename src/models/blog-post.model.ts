import { AutoIncrement, Field, Model } from '../db/decorators'

@Model()
export class BlogPost {
  @AutoIncrement()
  @Field({ type: 'number' })
  id!: number

  @Field({ type: 'string', required: true })
  title!: string

  @Field({ type: 'string' })
  content?: string
}
