import { Controller, Post, Get, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { StoriesService } from './stories.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('stories')
export class StoriesController {
  constructor(private stories: StoriesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@CurrentUser('id') userId: string, @Body('imageUrl') imageUrl: string) {
    return this.stories.create(userId, imageUrl);
  }

  @UseGuards(JwtAuthGuard)
  @Get('following')
  getFollowing(@CurrentUser('id') userId: string) {
    return this.stories.getFollowingStories(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/view')
  view(@Param('id') id: string, @CurrentUser('id') viewerId: string) {
    return this.stories.viewStory(id, viewerId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.stories.delete(id, userId);
  }
}
