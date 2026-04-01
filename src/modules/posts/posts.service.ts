import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Post, PostStatus } from './post.entity';
import { QueryPostsDto } from './dto/query-posts.dto';
import { PaginatedResult } from '@/common/interfaces/paginated-result.interface';
import { CreatePostDto } from './dto/create-post.dto';
import { Tag } from '../tags/tag.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  async findAll(query: QueryPostsDto): Promise<PaginatedResult<Post>> {
    const {
      page = 1,
      limit = 20,
      search,
      status,
      authorId,
      sortBy = 'post.createdAt',
      sortOrder = 'DESC',
      withAuthor,
    } = query;
    const queryBuilder = this.postRepository.createQueryBuilder('post');
    if (withAuthor) {
      queryBuilder
        .leftJoinAndSelect('post.author', 'author')
        .addSelect(['author.id', 'author.firstName', 'author.lastName', 'author.email']);
    }
    if (search) {
      queryBuilder.where('post.title ILIKE :search OR post.content ILIKE :search', {
        search: `%${search}%`,
      });
    }
    if (status) {
      queryBuilder.andWhere('post.status = :status', { status });
    }
    if (authorId) {
      queryBuilder.andWhere('post.authorId = :authorId', { authorId });
    }

    const safeSort = ['post.createdAt', 'post.viewCount', 'post.likeCount'].includes(sortBy)
      ? sortBy
      : 'post.createdAt';
    queryBuilder.orderBy(safeSort, sortOrder);

    const [posts, total] = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data: posts,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(authorId: string, createPostDto: CreatePostDto): Promise<Post> {
    const { tagIds, ...rest } = createPostDto;
    const tags = tagIds?.length ? await this.tagRepository.findBy({ id: In(tagIds) }) : [];
    const post = this.postRepository.create({
      ...rest,
      authorId,
      tags,
      slug: rest.slug || this.slugify(rest.title),
      publishedAt: rest.status === PostStatus.PUBLISHED ? new Date() : undefined,
    });
    return this.postRepository.save(post);
  }

  async findOne(id: string): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id },
      relations: {
        author: true,
        tags: true,
        comments: {
          author: true,
        },
      },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    return post;
  }

  async updateTags(id: string, tagIds: string[], userId: string): Promise<Post> {
    const post = await this.postRepository.findOne({
      where: { id, authorId: userId },
      relations: {
        tags: true,
      },
    });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    if (post.authorId !== userId) {
      throw new ForbiddenException('You are not the author of this post');
    }
    const tags = tagIds?.length ? await this.tagRepository.findBy({ id: In(tagIds) }) : [];
    post.tags = tags;
    return this.postRepository.save(post);
  }

  async incrementViewCount(id: string): Promise<void> {
    await this.postRepository.increment({ id }, 'viewCount', 1);
  }

  async delete(id: string, userId: string): Promise<void> {
    const post = await this.postRepository.findOne({ where: { id, authorId: userId } });
    if (!post) {
      throw new NotFoundException('Post not found');
    }
    if (post.authorId !== userId) {
      throw new ForbiddenException('You are not the author of this post');
    }
    await this.postRepository.softDelete(id);
  }

  private slugify(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
