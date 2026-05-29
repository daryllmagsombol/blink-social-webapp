import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FollowsService {
  constructor(private prisma: PrismaService) {}

  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new NotFoundException('Cannot follow yourself');
    }

    const target = await this.prisma.user.findUnique({ where: { id: followingId } });
    if (!target) throw new NotFoundException('User not found');

    const existing = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });

    if (existing) return { followed: true };

    await this.prisma.follow.create({ data: { followerId, followingId } });

    await this.prisma.notification.create({
      data: {
        type: 'FOLLOW',
        userId: followingId,
        actorId: followerId,
      },
    });

    return { followed: true };
  }

  async unfollow(followerId: string, followingId: string) {
    const existing = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });

    if (!existing) return { followed: false };

    await this.prisma.follow.delete({
      where: { followerId_followingId: { followerId, followingId } },
    });

    return { followed: false };
  }

  async getFollowers(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followingId: userId },
        skip,
        take: limit,
        include: {
          follower: { select: { id: true, username: true, avatarUrl: true, displayName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.follow.count({ where: { followingId: userId } }),
    ]);

    return {
      data: data.map((f) => f.follower),
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    };
  }

  async getFollowing(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followerId: userId },
        skip,
        take: limit,
        include: {
          following: { select: { id: true, username: true, avatarUrl: true, displayName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.follow.count({ where: { followerId: userId } }),
    ]);

    return {
      data: data.map((f) => f.following),
      total,
      page,
      limit,
      hasMore: skip + limit < total,
    };
  }

  async getFollowStatus(followerId: string, followingId: string) {
    const follow = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    return { following: !!follow };
  }
}
