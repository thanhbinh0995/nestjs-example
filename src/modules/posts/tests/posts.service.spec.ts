import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { PostsService } from '../posts.service';
import { Post, PostStatus } from '../post.entity';
import { Tag } from '../../tags/tag.entity';

const mockPost = (overrides: Partial<Post> = {}): Post =>
  ({
    id: 'post-1',
    title: 'Test Post',
    content: 'Content',
    slug: 'test-post',
    status: PostStatus.DRAFT,
    viewCount: 0,
    likeCount: 0,
    authorId: 'user-1',
    tags: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }) as Post;

const qbMock = () => ({
  leftJoinAndSelect: jest.fn().mockReturnThis(),
  leftJoin: jest.fn().mockReturnThis(),
  innerJoin: jest.fn().mockReturnThis(),
  addSelect: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  orderBy: jest.fn().mockReturnThis(),
  addOrderBy: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  groupBy: jest.fn().mockReturnThis(),
  getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
  getMany: jest.fn().mockResolvedValue([]),
  getRawMany: jest.fn().mockResolvedValue([]),
});

const mockRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  findBy: jest.fn(),
  softDelete: jest.fn(),
  increment: jest.fn(),
  createQueryBuilder: jest.fn().mockReturnValue(qbMock()),
});

describe('PostsService', () => {
  let service: PostsService;
  let postRepo: any;
  let tagRepo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        { provide: getRepositoryToken(Post), useFactory: mockRepo },
        { provide: getRepositoryToken(Tag), useFactory: mockRepo },
      ],
    }).compile();
    service = module.get(PostsService);
    postRepo = module.get(getRepositoryToken(Post));
    tagRepo = module.get(getRepositoryToken(Tag));
  });

  describe('create()', () => {
    it('creates a post without tags', async () => {
      const post = mockPost();
      postRepo.create.mockReturnValue(post);
      postRepo.save.mockResolvedValue(post);
      tagRepo.findBy.mockResolvedValue([]);
      const result = await service.create('user-1', { title: 'Test Post', content: 'C' });
      expect(postRepo.save).toHaveBeenCalled();
      expect(result.authorId).toBe('user-1');
    });

    it('resolves tag IDs to entities before save', async () => {
      const tag = { id: 'tag-1', name: 'nestjs' } as Tag;
      const post = mockPost({ tags: [tag] });
      postRepo.create.mockReturnValue(post);
      postRepo.save.mockResolvedValue(post);
      tagRepo.findBy.mockResolvedValue([tag]);
      await service.create('user-1', { title: 'T', content: 'C', tagIds: ['tag-1'] });
      expect(tagRepo.findBy).toHaveBeenCalled();
    });

    it('auto-generates slug from title', async () => {
      const post = mockPost({ slug: 'hello-world' });
      postRepo.create.mockReturnValue(post);
      postRepo.save.mockResolvedValue(post);
      tagRepo.findBy.mockResolvedValue([]);
      await service.create('user-1', { title: 'Hello World', content: 'C' });
      const createArg = postRepo.create.mock.calls[0][0] as any;
      expect(createArg.slug).toBe('hello-world');
    });
  });

  describe('findOne()', () => {
    it('returns post when found', async () => {
      postRepo.findOne.mockResolvedValue(mockPost());
      const result = await service.findOne('post-1');
      expect(result.id).toBe('post-1');
    });

    it('throws NotFoundException when not found', async () => {
      postRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('bad')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateTags()', () => {
    it('replaces tag array and saves', async () => {
      const post = mockPost({ tags: [] });
      const tag = { id: 'tag-1' } as Tag;
      postRepo.findOne.mockResolvedValue(post);
      tagRepo.findBy.mockResolvedValue([tag]);
      postRepo.save.mockResolvedValue({ ...post, tags: [tag] });
      const result = await service.updateTags('post-1', ['tag-1'], 'user-1');
      expect(result.tags).toHaveLength(1);
    });

    it('throws ForbiddenException for non-owner', async () => {
      postRepo.findOne.mockResolvedValue(mockPost({ authorId: 'other' }));
      await expect(service.updateTags('post-1', [], 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove()', () => {
    it('soft-deletes own post', async () => {
      postRepo.findOne.mockResolvedValue(mockPost());
      postRepo.softDelete.mockResolvedValue({ affected: 1 });
      await service.delete('post-1', 'user-1');
      expect(postRepo.softDelete).toHaveBeenCalledWith('post-1');
    });

    it('throws ForbiddenException for non-owner', async () => {
      postRepo.findOne.mockResolvedValue(mockPost({ authorId: 'other' }));
      await expect(service.delete('post-1', 'user-1')).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when post not found', async () => {
      postRepo.findOne.mockResolvedValue(null);
      await expect(service.delete('bad', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('incrementViews()', () => {
    it('calls increment with correct args', async () => {
      postRepo.increment.mockResolvedValue({ affected: 1 });
      await service.incrementViewCount('post-1');
      expect(postRepo.increment).toHaveBeenCalledWith({ id: 'post-1' }, 'viewCount', 1);
    });
  });
});
