import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException } from '@nestjs/common';
import { UsersService } from '../users.service';
import { UserRole, UserStatus } from '../entities/user.entity';
import { UsersRepository } from '../users.repository';
import { CreateUserDto } from '../dto/create-user.dto';

const mockUser = {
  id: 'uuid-1',
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
  role: UserRole.USER,
  status: UserStatus.ACTIVE,
  createdAt: new Date(),
  updatedAt: new Date(),
};

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

    service = module.get(UsersService);
    repo = module.get(UsersRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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
      repo.create.mockResolvedValue(mockUser);

      const result = await service.create(dto);
      expect(result).toBeDefined();
      expect(repo.create).toHaveBeenCalledWith(dto);
    });

    it('should throw ConflictException if email already exists', async () => {
      repo.findOneByEmail.mockResolvedValue(mockUser);

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
});
