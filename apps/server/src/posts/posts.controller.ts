import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
export class PostsController {
  constructor(private posts: PostsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('posts')
  create(@CurrentUser('id') userId: string, @Body() dto: CreatePostDto) {
    return this.posts.create(userId, dto);
  }

  @Get('posts/:id')
  findById(@Param('id') id: string) {
    return this.posts.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('posts/:id')
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdatePostDto,
  ) {
    return this.posts.update(id, userId, dto.caption);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('posts/:id')
  delete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.posts.delete(id, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('feed')
  getFeed(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.posts.getFeed(userId, Number(page) || 1, Number(limit) || 10);
  }

  @Get('explore')
  getExplore(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.posts.getExplore(Number(page) || 1, Number(limit) || 20);
  }

  @UseGuards(OptionalJwtAuthGuard)
  @Get('users/:userId/posts')
  getUserPosts(
    @Param('userId') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @CurrentUser('id') viewerId?: string,
  ) {
    return this.posts.getUserPosts(userId, Number(page) || 1, Number(limit) || 12, viewerId);
  }
}
