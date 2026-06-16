import { Controller, Get, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private users: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('suggestions')
  async findSuggestions(
    @CurrentUser('id') userId: string,
    @Query('limit') limitStr?: string,
  ) {
    const limit = parseInt(limitStr || '5', 10);
    const take = isNaN(limit) ? 5 : limit;
    const data = await this.users.findSuggestions(userId, take);
    return { data };
  }

  @Get('username/:username')
  findByUsername(@Param('username') username: string) {
    return this.users.findByUsername(username);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.users.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  update(@CurrentUser('id') userId: string, @Body() dto: UpdateUserDto) {
    return this.users.update(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me/privacy')
  togglePrivacy(@CurrentUser('id') userId: string) {
    return this.users.togglePrivacy(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('me')
  deleteAccount(@CurrentUser('id') userId: string) {
    return this.users.deleteAccount(userId);
  }
}
