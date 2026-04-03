import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { Auth } from '@/common/decorators/auth.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { User } from '@/modules/users/entities/user.entity';
import { Public } from '@/common/decorators/public.decorator';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Auth()
  @Post()
  create(@CurrentUser() user: User, @Body() createCommentDto: CreateCommentDto) {
    return this.commentsService.create(user.id, createCommentDto);
  }

  @Public()
  @Get('post/:postId')
  findAll(@Param('postId', ParseUUIDPipe) postId: string) {
    return this.commentsService.findByPost(postId);
  }

  @Public()
  @Get(':id/replies')
  findReplies(@Param('id', ParseUUIDPipe) id: string) {
    return this.commentsService.findAllReplies(id);
  }

  @Auth()
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCommentDto: { content: string },
    @CurrentUser() user: User,
  ) {
    return this.commentsService.update(id, updateCommentDto.content, user.id);
  }

  @Auth()
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: User) {
    return this.commentsService.remove(id, user.id);
  }
}
