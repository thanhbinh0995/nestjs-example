import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users.service';
import { UsersRepository } from '../users.repository';
import { CreateUserDto } from '../dto/create-user.dto';
import { User, UserRole, UserStatus } from '../entities/user.entity';

const mockUser = (): User =>
  ({
    id: 'uuid-1',
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  }) as User;

const mockUsersRepository = () => ({
  create: jest.fn(),
  findById: jest.fn(),
  findOneByEmail: jest.fn(),
  findAll: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let repo: jest.Mocked<ReturnType<typeof mockUsersRepository>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, { provide: UsersRepository, useFactory: mockUsersRepository }],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repo = module.get(UsersRepository);
  });

  describe('create', () => {
    it('should create a user successfully', async () => {
      const dto: CreateUserDto = {
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        password: 'Password123!',
      };
      repo.findOneByEmail.mockResolvedValue(null);
      repo.create.mockResolvedValue(mockUser());

      const result = await service.create(dto);
      expect(result).toBeDefined();
      expect(repo.create).toHaveBeenCalledWith(dto);
    });

    it('should throw ConflictException if email already exists', async () => {
      repo.findOneByEmail.mockResolvedValue(mockUser());

      await expect(
        service.create({
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
          password: 'Password123!',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should return a user if found', async () => {
      repo.findById.mockResolvedValue(mockUser());
      const result = await service.findOne('uuid-1');
      expect(result).toBeDefined();
      expect(result.id).toBe('uuid-1');
    });

    it('should throw NotFoundException if user not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findOne('bad-id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should soft-delete a user', async () => {
      repo.findById.mockResolvedValue(mockUser());
      await service.remove('uuid-1');
      expect(repo.softDelete).toHaveBeenCalledWith('uuid-1');
    });

    it('should throw NotFoundException if user not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.remove('bad-id')).rejects.toThrow(NotFoundException);
    });
  });
});
