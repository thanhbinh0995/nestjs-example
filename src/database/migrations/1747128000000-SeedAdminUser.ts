import { MigrationInterface, QueryRunner } from 'typeorm';
import {
  User,
  UserRole,
  UserStatus,
} from '../../modules/users/entities/user.entity';

/**
 * Seeds a default admin account if one does not exist for the email.
 * Override with SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD before running in non-dev environments.
 */
export class SeedAdminUser1747128000000 implements MigrationInterface {
  name = 'SeedAdminUser1747128000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const email =
      process.env.SEED_ADMIN_EMAIL?.trim() || 'admin@example.com';
    const password = process.env.SEED_ADMIN_PASSWORD?.trim();
    if (!password) {
      throw new Error(
        'Set SEED_ADMIN_PASSWORD in the environment before running this migration.',
      );
    }

    const repo = queryRunner.manager.getRepository(User);
    const existing = await repo.findOne({
      where: { email },
      select: ['id'],
    });
    if (existing) {
      return;
    }

    const admin = repo.create({
      email,
      firstName: 'Admin',
      lastName: 'User',
      password,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });
    await repo.save(admin);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const email =
      process.env.SEED_ADMIN_EMAIL?.trim() || 'admin@example.com';

    await queryRunner.manager
      .createQueryBuilder()
      .delete()
      .from(User)
      .where('email = :email', { email })
      .execute();
  }
}
