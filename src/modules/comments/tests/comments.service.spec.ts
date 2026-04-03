import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CommentsService } from '../comments.service';
import { Comment } from '../comment.entity';

const mockComment = (overrides: Partial<Comment> = {}): Comment =>
  ({
    id: 'c1',
    content: 'Test comment',
    postId: 'post-1',
    authorId: 'user-1',
    parentId: null,
    likeCount: 0,
    isEdited: false,
    createdAt: new Date(),
    ...overrides,
  }) as Comment;

const qbMock = () => ({
  where: jest.fn().mockReturnThis(),
  andWhere: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  take: jest.fn().mockReturnThis(),
  getMany: jest.fn().mockResolvedValue([]),
  query: jest.fn().mockResolvedValue([]),
});

const mockRepo = () => ({
  create: jest.fn(),
  save: jest.fn(),
  findOne: jest.fn(),
  find: jest.fn(),
  count: jest.fn(),
  softDelete: jest.fn(),
  query: jest.fn().mockResolvedValue([]),
  createQueryBuilder: jest.fn().mockReturnValue(qbMock()),
});

describe('CommentsService', () => {
  let service: CommentsService;
  let repo: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommentsService, { provide: getRepositoryToken(Comment), useFactory: mockRepo }],
    }).compile();
    service = module.get(CommentsService);
    repo = module.get(getRepositoryToken(Comment));
  });

  describe('create()', () => {
    it('creates top-level comment', async () => {
      const comment = mockComment();
      repo.create.mockReturnValue(comment);
      repo.save.mockResolvedValue(comment);
      const result = await service.create('user-1', { content: 'Hello!', postId: 'post-1' });
      expect(repo.save).toHaveBeenCalled();
      expect(result.authorId).toBe('user-1');
    });

    it('validates parent exists when parentId provided', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(
        service.create('user-1', { content: 'Reply', postId: 'post-1', parentId: 'bad-id' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates reply when valid parentId', async () => {
      const parent = mockComment({ id: 'parent-1' });
      const reply = mockComment({ parentId: 'parent-1' });
      repo.findOne.mockResolvedValue(parent);
      repo.create.mockReturnValue(reply);
      repo.save.mockResolvedValue(reply);
      const result = await service.create('user-1', {
        content: 'Reply',
        postId: 'post-1',
        parentId: 'parent-1',
      });
      expect(result.parentId).toBe('parent-1');
    });
  });

  describe('update()', () => {
    it('updates content and sets isEdited', async () => {
      const comment = mockComment();
      repo.findOne.mockResolvedValue(comment);
      repo.save.mockResolvedValue({ ...comment, content: 'Updated', isEdited: true });
      const result = await service.update('c1', 'Updated', 'user-1');
      expect(result.isEdited).toBe(true);
      expect(result.content).toBe('Updated');
    });

    it('throws ForbiddenException for non-author', async () => {
      repo.findOne.mockResolvedValue(mockComment({ authorId: 'other' }));
      await expect(service.update('c1', 'Updated', 'user-1')).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when comment not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.update('bad', 'x', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove()', () => {
    it('soft-deletes own comment', async () => {
      repo.findOne.mockResolvedValue(mockComment());
      repo.softDelete.mockResolvedValue({ affected: 1 });
      await service.remove('c1', 'user-1');
      expect(repo.softDelete).toHaveBeenCalledWith('c1');
    });

    it('throws ForbiddenException for non-author', async () => {
      repo.findOne.mockResolvedValue(mockComment({ authorId: 'other' }));
      await expect(service.remove('c1', 'user-1')).rejects.toThrow(ForbiddenException);
    });
  });
});
