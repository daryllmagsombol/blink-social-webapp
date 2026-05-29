import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private reports: ReportsService) {}

  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body('reason') reason: string,
    @Body('targetUserId') targetUserId?: string,
    @Body('postId') postId?: string,
    @Body('commentId') commentId?: string,
  ) {
    return this.reports.create(userId, reason, targetUserId, postId, commentId);
  }
}
