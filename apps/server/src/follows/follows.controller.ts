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

  @UseGuards(JwtAuthGuard)
  @Get('follow/requests')
  getPending(@Param('userId') userId: string) {
    return this.follows.getPendingRequests(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('follow/accept')
  accept(@Param('userId') followerId: string, @CurrentUser('id') followingId: string) {
    return this.follows.acceptFollow(followerId, followingId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('follow/reject')
  reject(@Param('userId') followerId: string, @CurrentUser('id') followingId: string) {
    return this.follows.rejectFollow(followerId, followingId);
  }

  @Get('followers')
  getFollowers(@Param('userId') userId: string, @Query('page') page?: string) {
    return this.follows.getFollowers(userId, Math.max(1, Number(page) || 1));
  }

  @Get('following')
  getFollowing(@Param('userId') userId: string, @Query('page') page?: string) {
    return this.follows.getFollowing(userId, Math.max(1, Number(page) || 1));
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
