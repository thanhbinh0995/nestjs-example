import { BeforeInsert, BeforeUpdate, Column, Entity, OneToOne } from 'typeorm';
import { BaseEntity } from '@/database/base.entity';
import * as bcrypt from 'bcryptjs';
import { Exclude } from 'class-transformer';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

@Entity('users')
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 255, select: false })
  @Exclude()
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column({ nullable: true })
  @Exclude()
  refreshToken?: string;

  @Column({ nullable: true, type: 'timestamptz' })
  lastLoginAt?: Date;

  @OneToOne('Profile', 'user', { cascade: true, eager: false })
  profile?: any;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    console.log('compare', { password, bb: this.password });

    return bcrypt.compare(password, this.password);
  }
}
