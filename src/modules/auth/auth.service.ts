import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { omit } from 'lodash';
import { UsersService } from '@/modules/users/users.service';
import { UsersRepository } from '@/modules/users/users.repository';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { User } from '@/modules/users/entities/user.entity';
import { AuthTokens } from '@/types/auth';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private userRepository: UsersRepository,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    return 'Register user ';
  }

  async login(loginDto: LoginDto): Promise<{ user: Omit<User, 'password'>; tokens: AuthTokens }> {
    const user = await this.userRepository.findOneByEmail(loginDto.email, true);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const isPasswordValid = await user.validatePassword(loginDto.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return { user: omit(user, ['password']), tokens };
  }

  private async generateTokens(userId: string, email: string, role: string): Promise<AuthTokens> {
    const payload: JwtPayload = { sub: userId, email, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.secret'),
        expiresIn: this.configService.get('jwt.expiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: this.configService.get('jwt.refreshExpiresIn'),
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
