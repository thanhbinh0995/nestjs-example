import { BaseEntity } from '@/database/base.entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Exclude } from 'class-transformer';

@Entity('profiles')
export class Profile extends BaseEntity {
  @OneToOne(() => User, (user) => user.profile, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ name: 'userId' })
  userId: string;

  @Column({ nullable: true, length: 500 })
  bio?: string;

  @Column({ length: 500, nullable: true })
  avatarUrl?: string;

  @Column({ length: 100, nullable: true })
  website?: string;

  @Column({ nullable: true, length: 100 })
  location?: string;

  @Column({ nullable: true, type: 'date' })
  dateOfBirth?: string;

  @Column({ nullable: true, length: 30 })
  @Exclude()
  phoneNumber?: string;

  @Column({ default: false })
  isPublic: boolean;

  @Column({ type: 'jsonb', nullable: true })
  socialLinks?: {
    twitter?: string;
    github?: string;
    linkedin?: string;
  };
}
