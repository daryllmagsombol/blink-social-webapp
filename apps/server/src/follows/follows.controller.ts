import { Controller, Post, Delete, Get, Param, Query, UseGuards } from '@nestjs/common';
import { FollowsService } from './follows.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users/:userId')
export class FollowsController {
  constructor(private follows: FollowsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('follow')
  follow(@CurrentUser('id') currentUserId: string, @Param('userId') targetId: string) {
    return this.follows.follow(currentUserId, targetId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('follow')
  unfollow(@CurrentUser('id') currentUserId: string, @Param('userId') targetId: string) {
    return this.follows.unfollow(currentUserId, targetId);
  }

  @Get('followers')
  getFollowers(@Param('userId') userId: string, @Query('page') page?: string) {
    return this.follows.getFollowers(userId, Number(page) || 1);
  }

  @Get('following')
  getFollowing(@Param('userId') userId: string, @Query('page') page?: string) {
    return this.follows.getFollowing(userId, Number(page) || 1);
  }

  @UseGuards(JwtAuthGuard)
  @Get('follow/status')
  getFollowStatus(
    @CurrentUser('id') currentUserId: string,
    @Param('userId') targetId: string,
  ) {
    return this.follows.getFollowStatus(currentUserId, targetId);
  }
}
