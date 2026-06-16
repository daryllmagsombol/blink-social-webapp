import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LikesService {
  constructor(private prisma: PrismaService) {}

  async like(userId: string, postId: string) {
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
    if (block) throw new ForbiddenException('Cannot like this post');

    if (post.user.isPrivate && post.user.id !== userId) {
      const follow = await this.prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: userId, followingId: post.user.id } },
      });
      if (!follow) throw new ForbiddenException('Cannot like this post');
    }

    const existing = await this.prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) return { liked: true };

    await this.prisma.like.create({ data: { userId, postId } });

    if (post.userId !== userId) {
      await this.prisma.notification.create({
        data: {
          type: 'LIKE',
          userId: post.userId,
          actorId: userId,
          postId,
        },
      });
    }

    return { liked: true };
  }

  async unlike(userId: string, postId: string) {
    const existing = await this.prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (!existing) return { liked: false };

    await this.prisma.like.delete({
      where: { userId_postId: { userId, postId } },
    });

    return { liked: false };
  }

  async getPostLikes(postId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.like.findMany({
        where: { postId },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.like.count({ where: { postId } }),
    ]);

    return {
      data: data.map((l) => l.user),
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    };
  }

  async isLiked(userId: string, postId: string) {
    const like = await this.prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    return { liked: !!like };
  }
}
