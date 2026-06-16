import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
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

    const block = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: followerId, blockedId: followingId },
          { blockerId: followingId, blockedId: followerId },
        ],
      },
    });
    if (block) throw new ForbiddenException('Cannot follow this user');

    const existing = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });

    if (existing) return { followed: true, status: existing.status };

    const status = target.isPrivate ? 'PENDING' : 'ACCEPTED';

    await this.prisma.follow.create({
      data: { followerId, followingId, status },
    });

    if (status === 'ACCEPTED') {
      await this.prisma.notification.create({
        data: {
          type: 'FOLLOW',
          userId: followingId,
          actorId: followerId,
        },
      });
    }

    return { followed: true, status };
  }

  async acceptFollow(followerId: string, followingId: string) {
    const follow = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });

    if (!follow || follow.status !== 'PENDING') {
      throw new NotFoundException('No pending follow request');
    }

    await this.prisma.follow.update({
      where: { followerId_followingId: { followerId, followingId } },
      data: { status: 'ACCEPTED' },
    });

    await this.prisma.notification.create({
      data: {
        type: 'FOLLOW',
        userId: followingId,
        actorId: followerId,
      },
    });

    return { accepted: true };
  }

  async rejectFollow(followerId: string, followingId: string) {
    const follow = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });

    if (!follow || follow.status !== 'PENDING') {
      throw new NotFoundException('No pending follow request');
    }

    await this.prisma.follow.delete({
      where: { followerId_followingId: { followerId, followingId } },
    });

    return { rejected: true };
  }

  async getPendingRequests(userId: string) {
    const requests = await this.prisma.follow.findMany({
      where: { followingId: userId, status: 'PENDING' },
      include: {
        follower: { select: { id: true, username: true, avatarUrl: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((r) => r.follower);
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
        where: { followingId: userId, status: 'ACCEPTED' },
        skip,
        take: limit,
        include: {
          follower: { select: { id: true, username: true, avatarUrl: true, displayName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.follow.count({ where: { followingId: userId, status: 'ACCEPTED' } }),
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
        where: { followerId: userId, status: 'ACCEPTED' },
        skip,
        take: limit,
        include: {
          following: { select: { id: true, username: true, avatarUrl: true, displayName: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.follow.count({ where: { followerId: userId, status: 'ACCEPTED' } }),
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
    return { following: !!follow, status: follow?.status || null };
  }
}
