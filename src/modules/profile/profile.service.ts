import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Profile } from './profile.entity';
import { Repository } from 'typeorm';
import { UpsertProfileDto } from './dto/upsert-profile.dto';

@Injectable()
export class ProfileService {
  constructor(@InjectRepository(Profile) private readonly profileRepository: Repository<Profile>) {}

  async findByUserId(userId: string): Promise<Profile> {
    const profile = await this.profileRepository.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }

  async findWithUser(userId: string): Promise<Profile> {
    const profile = await this.profileRepository.findOne({
      where: { userId },
      relations: { user: true },
    });
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return profile;
  }

  async upsert(userId: string, dto: UpsertProfileDto): Promise<Profile> {
    let profile = await this.profileRepository.findOne({ where: { userId } });

    if (!profile) {
      profile = this.profileRepository.create({ userId, ...dto });
    } else {
      Object.assign(profile, dto);
    }

    return this.profileRepository.save(profile);
  }
}
