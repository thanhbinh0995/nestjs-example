import { Body, Controller, Delete, Get, Param, Post, Query } from '@nestjs/common';
import { Auth } from '@/common/decorators/auth.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { CreateTagDto } from './dto/create-tag.dto';
import { TagsService } from './tags.service';
import { Roles } from '@/common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Auth()
  @Roles(UserRole.ADMIN)
  @Post()
  create(@Body() createTagDto: CreateTagDto) {
    return this.tagsService.create(createTagDto);
  }

  @Public()
  @Get()
  findAll() {
    return this.tagsService.findAll();
  }

  @Public()
  @Get('popular')
  findPopular(@Query('limit') limit: number) {
    return this.tagsService.findPopular(limit);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tagsService.findOne(id);
  }

  @Public()
  @Get(':id/posts')
  findPosts(@Param('id') id: string) {
    return this.tagsService.findWithPosts(id);
  }

  @Auth()
  @Delete('id')
  delete(@Param('id') id: string) {
    return this.tagsService.delete(id);
  }
}
