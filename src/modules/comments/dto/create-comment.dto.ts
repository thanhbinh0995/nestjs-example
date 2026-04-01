import { IsOptional, IsString, IsUUID } from 'class-validator';
import { IsNotEmpty } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsUUID()
  postId: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;
}
