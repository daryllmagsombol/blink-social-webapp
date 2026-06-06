import { Controller, Post, Delete, Get, Param, Query, UseGuards } from '@nestjs/common';
import { LikesService } from './likes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('posts/:postId/likes')
export class LikesController {
  constructor(private likes: LikesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  like(@CurrentUser('id') userId: string, @Param('postId') postId: string) {
    return this.likes.like(userId, postId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete()
  unlike(@CurrentUser('id') userId: string, @Param('postId') postId: string) {
    return this.likes.unlike(userId, postId);
  }

  @Get()
  list(@Param('postId') postId: string, @Query('page') page?: string) {
    return this.likes.getPostLikes(postId, Math.max(1, Number(page) || 1));
  }

  @UseGuards(JwtAuthGuard)
  @Get('check')
  check(@CurrentUser('id') userId: string, @Param('postId') postId: string) {
    return this.likes.isLiked(userId, postId);
  }
}
