import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersRepository } from './users.repository';
import { QueryUsersDto } from './dto/query-user.dto';
import { PaginatedResult } from '@/common/interfaces/paginated-result.interface';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async create(createUserDto: CreateUserDto) {
    const existing = await this.usersRepository.findOneByEmail(createUserDto.email);
    if (existing) {
      throw new ConflictException('Email already exists');
    }
    return this.usersRepository.create(createUserDto);
  }

  async findAll(query: QueryUsersDto): Promise<PaginatedResult<User>> {
    return this.usersRepository.findAll(query);
  }

  async findOne(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    await this.findOne(id);
    if (updateUserDto.email) {
      const existing = await this.usersRepository.findOneByEmail(updateUserDto.email);
      if (existing) {
        throw new ConflictException('Email already exists');
      }
    }

    return this.usersRepository.update(id, updateUserDto);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.usersRepository.softDelete(id);
  }
}
