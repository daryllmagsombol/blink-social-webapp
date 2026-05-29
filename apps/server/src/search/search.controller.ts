import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { SearchService } from './search.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
export class SearchController {
  constructor(private searchService: SearchService) {}

  @UseGuards(JwtAuthGuard)
  @Get('search')
  search(
    @Query('q') q: string,
    @Query('type') type?: string,
  ) {
    return this.searchService.search(q, type || 'all');
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
    return this.searchService.postsByTag(tag, Number(page) || 1, Number(limit) || 12);
  }
}
