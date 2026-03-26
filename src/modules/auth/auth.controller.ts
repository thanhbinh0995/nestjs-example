import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '../users/entities/user.entity';
import { AuthTokens } from '@/types/auth';
import { Public } from '@/common/decorators/public.decorator';
import { Auth } from '@/common/decorators/auth.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Public()
  @Post('login')
  login(@Body() loginDto: LoginDto): Promise<{ user: Omit<User, 'password'>; tokens: AuthTokens }> {
    return this.authService.login(loginDto);
  }

  @Auth()
  @Post('logout')
  logout() {
    return 'Logout user ';
  }
}
