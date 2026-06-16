import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CommentsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, postId: string, content: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { user: { select: { id: true, isPrivate: true } } },
    });
    if (!post) throw new NotFoundException('Post not found');

    const block = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: userId, blockedId: post.userId },
          { blockerId: post.userId, blockedId: userId },
        ],
      },
    });
    if (block) throw new ForbiddenException('Cannot comment on this post');

    if (post.user.isPrivate && post.user.id !== userId) {
      const follow = await this.prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: userId, followingId: post.user.id } },
      });
      if (!follow) throw new ForbiddenException('Cannot comment on this post');
    }

    const comment = await this.prisma.comment.create({
      data: { userId, postId, content },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    if (post.userId !== userId) {
      await this.prisma.notification.create({
        data: {
          type: 'COMMENT',
          userId: post.userId,
          actorId: userId,
          postId,
        },
      });
    }

    return comment;
  }

  async getPostComments(postId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { postId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
        },
      }),
      this.prisma.comment.count({ where: { postId } }),
    ]);

    return { data, total, page, limit, hasMore: skip + limit < total };
  }

  async update(id: string, userId: string, content: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.userId !== userId) throw new NotFoundException('Comment not found');

    return this.prisma.comment.update({
      where: { id },
      data: { content },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
      },
    });
  }

  async delete(id: string, userId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException('Comment not found');
    if (comment.userId !== userId) throw new NotFoundException('Comment not found');

    await this.prisma.comment.delete({ where: { id } });
    return { success: true };
  }
}
