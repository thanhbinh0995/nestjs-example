import { Column, Entity, Index, ManyToMany } from 'typeorm';
import { BaseEntity } from '@/database/base.entity';
import { Post } from '../posts/post.entity';

@Entity('tags')
export class Tag extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  @Index()
  name: string;

  @Column({ nullable: true, length: 255 })
  description: string;

  @Column({ nullable: true })
  colorHex?: string;

  @ManyToMany(() => Post, (post) => post.tags)
  posts?: Post[];

  //   @ManyToMany('Users', 'tags')
  //   users?: User[];
}
