import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async create(
    reporterId: string,
    reason: string,
    targetUserId?: string,
    postId?: string,
    commentId?: string,
  ) {
    if (!targetUserId && !postId && !commentId) {
      throw new BadRequestException('Must specify a target user, post, or comment');
    }

    return this.prisma.report.create({
      data: { reporterId, reason, targetUserId, postId, commentId },
    });
  }
}
