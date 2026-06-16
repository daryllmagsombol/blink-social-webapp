import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
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

    if (!reason || reason.trim().length < 10) {
      throw new BadRequestException('Reason must be at least 10 characters');
    }

    if (targetUserId) {
      const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
      if (!user) throw new BadRequestException('Target user not found');

      const existing = await this.prisma.report.findFirst({
        where: { reporterId, targetUserId },
      });
      if (existing) throw new ConflictException('You have already reported this user');
    }

    if (postId) {
      const post = await this.prisma.post.findUnique({ where: { id: postId } });
      if (!post) throw new BadRequestException('Target post not found');

      const existing = await this.prisma.report.findFirst({
        where: { reporterId, postId },
      });
      if (existing) throw new ConflictException('You have already reported this post');
    }

    if (commentId) {
      const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
      if (!comment) throw new BadRequestException('Target comment not found');

      const existing = await this.prisma.report.findFirst({
        where: { reporterId, commentId },
      });
      if (existing) throw new ConflictException('You have already reported this comment');
    }

    return this.prisma.report.create({
      data: { reporterId, reason, targetUserId, postId, commentId },
    });
  }
}
