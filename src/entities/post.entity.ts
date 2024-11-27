import { Entity, ObjectIdColumn, ObjectId, Column } from 'typeorm';

@Entity('posts')
export class Post {
  @ObjectIdColumn()
  id?: ObjectId;

  @Column()
  title: string;

  @Column()
  url: string;

  @Column()
  keyword: string;

  @Column({ default: new Date() })
  createdAt?: Date;
}
