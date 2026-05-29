import { IsString, IsOptional, MaxLength } from 'class-validator';

export class CreatePostDto {
  @IsString()
  imageUrl: string;

  @IsOptional()
  @IsString()
  @MaxLength(2200)
  caption?: string;
}
