import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post, PostStatus } from './post.entity';
import { QueryPostsDto } from './dto/query-posts.dto';
import { PaginatedResult } from '@/common/interfaces/paginated-result.interface';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
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
    const post = this.postRepository.create({
      ...createPostDto,
      authorId,
      slug: createPostDto.slug || this.slugify(createPostDto.title),
      publishedAt: createPostDto.status === PostStatus.PUBLISHED ? new Date() : undefined,
    });
    return this.postRepository.save(post);
  }

  private slugify(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
