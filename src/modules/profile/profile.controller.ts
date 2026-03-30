import { Body, Controller, Get, Put } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { Auth } from '@/common/decorators/auth.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { UpsertProfileDto } from './dto/upsert-profile.dto';
import { User } from '../users/entities/user.entity';

@Auth()
@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('me')
  getMyProfile(@CurrentUser() user: User) {
    return this.profileService.findByUserId(user.id);
  }

  @Get('me/with-user')
  getMyProfileWithUser(@CurrentUser() user: User) {
    return this.profileService.findWithUser(user.id);
  }

  @Put('me')
  upsert(@CurrentUser() user: User, @Body() updateProfileDto: UpsertProfileDto) {
    return this.profileService.upsert(user.id, updateProfileDto);
  }
}
