import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
export class SearchController {
  constructor(private searchService: SearchService) {}

  @UseGuards(JwtAuthGuard)
  @Get('search')
  search(
    @Query('q') q: string,
    @Query('type') type?: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.searchService.search(q, type || 'all', userId);
  }

  @Get('tags/trending')
  trending() {
    return this.searchService.trending();
  }

  @Get('tags/:tag/posts')
  getPostsByTag(
    @Param('tag') tag: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.searchService.postsByTag(tag, Math.max(1, Number(page) || 1), Math.min(Number(limit) || 12, 100));
  }
}
