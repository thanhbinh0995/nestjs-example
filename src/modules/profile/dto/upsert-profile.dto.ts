import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateNested,
} from 'class-validator';

class SocialLinksDto {
  @IsOptional()
  @IsUrl()
  twitter?: string;

  @IsOptional()
  @IsUrl()
  github?: string;

  @IsOptional()
  @IsUrl()
  linkedin?: string;
}

export class UpsertProfileDto {
  @IsString()
  @IsOptional()
  bio?: string;

  @IsUrl()
  @IsOptional()
  avatarUrl?: string;

  @IsUrl()
  @IsOptional()
  website?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  location?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsOptional()
  @MaxLength(30)
  phoneNumber?: string;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ValidateNested()
  @Type(() => SocialLinksDto)
  @IsOptional()
  socialLinks?: SocialLinksDto;
}
