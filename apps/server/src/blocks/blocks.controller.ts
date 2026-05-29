import { Controller, Post, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { BlocksService } from './blocks.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class BlocksController {
  constructor(private blocks: BlocksService) {}

  @Post('users/:userId/block')
  block(@CurrentUser('id') blockerId: string, @Param('userId') blockedId: string) {
    return this.blocks.block(blockerId, blockedId);
  }

  @Delete('users/:userId/block')
  unblock(@CurrentUser('id') blockerId: string, @Param('userId') blockedId: string) {
    return this.blocks.unblock(blockerId, blockedId);
  }

  @Get('users/:userId/block/status')
  status(@CurrentUser('id') blockerId: string, @Param('userId') blockedId: string) {
    return this.blocks.getBlockStatus(blockerId, blockedId);
  }
}
