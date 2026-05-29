import { Controller, Post, Get, Param, Query, UseGuards } from '@nestjs/common';
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
    return this.bookmarks.findByUser(userId, Number(page) || 1, Number(limit) || 12);
  }

  @Get('posts/:postId/bookmark/check')
  check(@CurrentUser('id') userId: string, @Param('postId') postId: string) {
    return this.bookmarks.check(userId, postId);
  }
}
