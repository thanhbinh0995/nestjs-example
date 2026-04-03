import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { CreateCommentDto } from './dto/create-comment.dto';
import { Comment } from './comment.entity';

@Injectable()
export class CommentsService {
  constructor(@InjectRepository(Comment) private readonly commentRepository: Repository<Comment>) {}

  async create(authorId: string, dto: CreateCommentDto): Promise<Comment> {
    if (dto.parentId) {
      const parent = await this.commentRepository.findOne({
        where: { id: dto.parentId },
      });
      if (!parent) {
        throw new NotFoundException('Parent comment not found');
      }
    }
    const comment = this.commentRepository.create({ ...dto, authorId });
    return this.commentRepository.save(comment);
  }

  async findByPost(postId: string): Promise<Comment[]> {
    return this.commentRepository.find({
      where: { postId, parentId: IsNull() },
      relations: {
        author: true,
        replies: true,
      },
      order: { createdAt: 'DESC' },
    });
  }

  async findAllReplies(commentId: string): Promise<Comment[]> {
    return await this.commentRepository.query(
      `
        WITH RECURSIVE thread AS (
          SELECT * FROM comments WHERE id = $1
          UNION ALL
          SELECT c.* FROM comments c
          INNER JOIN thread t ON c."parentId" = t.id
        )
        SELECT * FROM thread WHERE id != $1
        ORDER BY "createdAt" ASC
      `,
      [commentId],
    );
  }

  async update(commentId: string, content: string, userId: string): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.authorId !== userId) {
      throw new ForbiddenException('You are not the author of this comment');
    }
    comment.content = content;
    comment.isEdited = true;
    return this.commentRepository.save(comment);
  }

  async remove(commentId: string, userId: string): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id: commentId },
    });
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }
    if (comment.authorId !== userId) {
      throw new ForbiddenException('You are not the author of this comment');
    }
    await this.commentRepository.softDelete(commentId);
  }
}
