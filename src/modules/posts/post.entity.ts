import { BaseEntity } from '@/database/base.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Tag } from '../tags/tag.entity';
import { Comment } from '../comments/comment.entity';

export enum PostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Entity('posts')
export class Post extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar', length: 255 })
  @Index()
  slug?: string;

  @Column({ type: 'enum', enum: PostStatus, default: PostStatus.DRAFT })
  status: PostStatus;

  @Column({ default: 0, type: 'integer' })
  viewCount: number;

  @Column({ default: 0, type: 'integer' })
  likeCount: number;

  @Column({ nullable: true, type: 'timestamptz' })
  publishedAt?: Date;

  @ManyToOne(() => User, (user) => user.posts, {
    onDelete: 'CASCADE',
    eager: false,
    nullable: false,
  })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  authorId: string;

  @OneToMany('Comment', 'post')
  comments?: Comment[];

  @ManyToMany(() => Tag, (tag) => tag.posts, { cascade: ['insert', 'update'] })
  @JoinTable({
    name: 'post_tags',
    joinColumn: { name: 'postId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' },
  })
  tags?: Tag[];
}
