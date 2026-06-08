import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        isPrivate: true,
        createdAt: true,
        _count: { select: { followers: true, following: true, posts: true } },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return {
      ...user,
      followersCount: user._count.followers,
      followingCount: user._count.following,
      postsCount: user._count.posts,
    };
  }

  async findByUsername(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
        isPrivate: true,
        createdAt: true,
        _count: { select: { followers: true, following: true, posts: true } },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    return {
      ...user,
      followersCount: user._count.followers,
      followingCount: user._count.following,
      postsCount: user._count.posts,
    };
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        avatarUrl: true,
      },
    });

    return user;
  }

  async togglePrivacy(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: userId },
      data: { isPrivate: !user.isPrivate },
      select: { id: true, isPrivate: true },
    });
  }

  async deleteAccount(userId: string) {
    await this.prisma.notification.deleteMany({ where: { actorId: userId } });
    await this.prisma.user.delete({ where: { id: userId } });
    return { success: true };
  }

  async findSuggestions(userId: string, limit: number = 5) {
    // Get IDs the current user is already following
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    // Get IDs of blocked users (both directions)
    const blocked = await this.prisma.block.findMany({
      where: {
        OR: [{ blockerId: userId }, { blockedId: userId }],
      },
      select: { blockerId: true, blockedId: true },
    });

    const excludeIds = [
      userId,
      ...following.map((f) => f.followingId),
      ...blocked.flatMap((b) => [b.blockerId, b.blockedId]),
    ];

    return this.prisma.user.findMany({
      where: { id: { notIn: excludeIds } },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        _count: { select: { followers: true } },
      },
      orderBy: { followers: { _count: 'desc' } },
      take: limit,
    });
  }

  async updateAvatar(id: string, avatarUrl: string) {
    return this.prisma.user.update({
      where: { id },
      data: { avatarUrl },
      select: { id: true, avatarUrl: true },
    });
  }
}
