import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreatePostDto) {
    return this.prisma.post.create({
      data: {
        userId,
        imageUrl: dto.imageUrl,
        caption: dto.caption,
      },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });
  }

  async findById(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async delete(id: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.userId !== userId) throw new NotFoundException('Post not found');

    await this.prisma.post.delete({ where: { id } });
  }

  async getFeed(userId: string, page = 1, limit = 10) {
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);
    followingIds.push(userId);

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.post.findMany({
        where: { userId: { in: followingIds } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
          _count: { select: { likes: true, comments: true } },
        },
      }),
      this.prisma.post.count({
        where: { userId: { in: followingIds } },
      }),
    ]);

    return { data, total, page, limit, hasMore: skip + limit < total };
  }

  async getExplore(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.post.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
          _count: { select: { likes: true, comments: true } },
        },
      }),
      this.prisma.post.count(),
    ]);

    return { data, total, page, limit, hasMore: skip + limit < total };
  }

  async getUserPosts(userId: string, page = 1, limit = 12) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.post.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          _count: { select: { likes: true, comments: true } },
        },
      }),
      this.prisma.post.count({ where: { userId } }),
    ]);

    return { data, total, page, limit, hasMore: skip + limit < total };
  }
}
