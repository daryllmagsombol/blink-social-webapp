import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('posts/:postId/comments')
export class CommentsController {
  constructor(private comments: CommentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Param('postId') postId: string,
    @Body('content') content: string,
  ) {
    return this.comments.create(userId, postId, content);
  }

  @Get()
  list(@Param('postId') postId: string, @Query('page') page?: string) {
    return this.comments.getPostComments(postId, Number(page) || 1);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body('content') content: string,
  ) {
    return this.comments.update(id, userId, content);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.comments.delete(id, userId);
  }
}
