import { Injectable } from '@nestjs/common';
import { FindOptionsWhere, Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { QueryUsersDto } from './dto/query-user.dto';
import { PaginatedResult } from '@/common/interfaces/paginated-result.interface';

@Injectable()
export class UsersRepository {
  constructor(@InjectRepository(User) private readonly userRepository: Repository<User>) {}

  async findAll(query: QueryUsersDto): Promise<PaginatedResult<User>> {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = query;

    const where: FindOptionsWhere<User> = {};
    if (status) where.status = status;

    const qb = this.userRepository.createQueryBuilder('user');

    if (search) {
      qb.where(
        '(user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search)',
        { search: `%${search}%` },
      );
    }
    if (status) qb.andWhere('user.status = :status', { status });

    const allowedSortFields = ['createdAt', 'email', 'firstName', 'lastName'];
    const safeSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';

    qb.orderBy(`user.${safeSortBy}`, sortOrder)
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findOneByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }
}
