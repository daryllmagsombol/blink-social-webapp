import { Controller, Post, Get, Param, Query, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { BookmarksService } from './bookmarks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class BookmarksController {
  constructor(private bookmarks: BookmarksService) {}

  @Post('posts/:postId/bookmark')
  toggle(@CurrentUser('id') userId: string, @Param('postId') postId: string) {
    return this.bookmarks.toggle(userId, postId);
  }

  @Get('bookmarks')
  list(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.bookmarks.findByUser(userId, Math.max(1, Number(page) || 1), Math.min(Number(limit) || 12, 100));
  }

  @SkipThrottle({ short: true })
  @Get('posts/:postId/bookmark/check')
  check(@CurrentUser('id') userId: string, @Param('postId') postId: string) {
    return this.bookmarks.check(userId, postId);
  }
}
