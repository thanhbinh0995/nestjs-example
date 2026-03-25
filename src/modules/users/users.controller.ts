import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PaginatedResult } from '@/common/interfaces/paginated-result.interface';
import { Auth } from '@/common/decorators/auth.decorator';
import { User } from './entities/user.entity';
import { QueryUsersDto } from './dto/query-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Auth()
  @Get()
  findAll(@Query() query: QueryUsersDto): Promise<PaginatedResult<User>> {
    return this.usersService.findAll(query);
  }

  @Auth()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
