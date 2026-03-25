import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';
import { AuthTokens } from '@/types/auth';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  login(@Body() loginDto: LoginDto): Promise<{ user: Omit<User, 'password'>; tokens: AuthTokens }> {
    return this.authService.login(loginDto);
  }

  @Post('logout')
  logout() {
    return 'Logout user ';
  }
}
