import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { Public } from '@/common/decorators/public.decorator';
import { QueryPostsDto } from './dto/query-posts.dto';
import { Auth } from '@/common/decorators/auth.decorator';
import { CreatePostDto } from './dto/create-post.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Public()
  @Get()
  findAll(@Query() query: QueryPostsDto) {
    return this.postsService.findAll(query);
  }

  @Auth()
  @Post()
  create(@CurrentUser() user: User, @Body() createPostDto: CreatePostDto) {
    return this.postsService.create(user.id, createPostDto);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    this.postsService.incrementViewCount(id);
    return this.postsService.findOne(id);
  }

  @Auth()
  @Patch(':id/tags')
  updateTags(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { tagIds: string[] },
    @CurrentUser() user: User,
  ) {
    return this.postsService.updateTags(id, body.tagIds, user.id);
  }

  @Auth()
  @Delete(':id')
  delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.postsService.delete(id, user.id);
  }
}
