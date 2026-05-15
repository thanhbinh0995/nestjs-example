import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Auth } from '@/common/decorators/auth.decorator';
import { PostsService } from '@/modules/posts/posts.service';
import { Post, PostStatus } from '@/modules/posts/post.entity';
import { QueryPostsDto } from '@/modules/posts/dto/query-posts.dto';

interface ListPostsRequest {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  authorId?: string;
  sortBy?: string;
  sortOrder?: string;
  withAuthor?: boolean;
}

interface PostAuthorMessage {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface PostMessage {
  id: string;
  title: string;
  content: string;
  slug: string;
  status: string;
  viewCount: number;
  likeCount: number;
  publishedAt: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  author?: PostAuthorMessage;
}

interface ListPostsResponse {
  posts: PostMessage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const SORT_BY_MAP: Record<string, string> = {
  createdAt: 'post.createdAt',
  viewCount: 'post.viewCount',
  likeCount: 'post.likeCount',
  'post.createdAt': 'post.createdAt',
  'post.viewCount': 'post.viewCount',
  'post.likeCount': 'post.likeCount',
};

@Controller()
export class GrpcPostsController {
  constructor(private readonly postsService: PostsService) {}

  @Auth()
  @GrpcMethod('PostService', 'ListPosts')
  async listPosts(request: ListPostsRequest): Promise<ListPostsResponse> {
    const query = this.toQueryDto(request);
    const result = await this.postsService.findAll(query);

    return {
      posts: result.data.map((post) => this.toPostMessage(post, request.withAuthor)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  private toQueryDto(request: ListPostsRequest): QueryPostsDto {
    const sortBy = request.sortBy ? (SORT_BY_MAP[request.sortBy] ?? 'post.createdAt') : undefined;
    const sortOrder =
      request.sortOrder === 'ASC' || request.sortOrder === 'DESC' ? request.sortOrder : undefined;

    return {
      page: request.page || undefined,
      limit: request.limit || undefined,
      search: request.search || undefined,
      status: this.parseStatus(request.status),
      authorId: request.authorId || undefined,
      sortBy,
      sortOrder,
      withAuthor: request.withAuthor ?? false,
    };
  }

  private parseStatus(status?: string): PostStatus | undefined {
    if (!status) {
      return undefined;
    }
    const values = Object.values(PostStatus);
    return values.includes(status as PostStatus) ? (status as PostStatus) : undefined;
  }

  private toPostMessage(post: Post, withAuthor?: boolean): PostMessage {
    const message: PostMessage = {
      id: post.id,
      title: post.title,
      content: post.content,
      slug: post.slug ?? '',
      status: post.status,
      viewCount: post.viewCount,
      likeCount: post.likeCount,
      publishedAt: post.publishedAt?.toISOString() ?? '',
      authorId: post.authorId,
      createdAt: post.createdAt?.toISOString() ?? '',
      updatedAt: post.updatedAt?.toISOString() ?? '',
    };

    if (withAuthor && post.author) {
      message.author = {
        id: post.author.id,
        firstName: post.author.firstName,
        lastName: post.author.lastName,
        email: post.author.email,
      };
    }

    return message;
  }
}
