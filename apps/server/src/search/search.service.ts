import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(q: string, type: string, userId?: string) {
    if (!q || q.trim().length === 0) {
      return { users: [], posts: [] };
    }

    const term = q.trim();

    let blockedIds: string[] = [];
    if (userId) {
      const blocked = await this.prisma.block.findMany({
        where: { blockerId: userId },
        select: { blockedId: true },
      });
      blockedIds = blocked.map((b) => b.blockedId);
    }

    const results: { users?: any[]; posts?: any[] } = {};

    if (type === 'all' || type === 'users') {
      results.users = await this.prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: term, mode: 'insensitive' } },
            { displayName: { contains: term, mode: 'insensitive' } },
          ],
          NOT: blockedIds.length > 0 ? { id: { in: blockedIds } } : undefined,
        },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          _count: { select: { followers: true } },
        },
        take: 20,
      });
    }

    if (type === 'all' || type === 'posts') {
      results.posts = await this.prisma.post.findMany({
        where: {
          caption: { contains: term, mode: 'insensitive' },
          NOT: blockedIds.length > 0 ? { userId: { in: blockedIds } } : undefined,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
          tags: { select: { name: true } },
          _count: { select: { likes: true, comments: true } },
        },
      });
    }

    return results;
  }

  async trending() {
    const tags = await this.prisma.tag.findMany({
      orderBy: { posts: { _count: 'desc' } },
      take: 10,
      include: { _count: { select: { posts: true } } },
    });
    return tags;
  }

  async postsByTag(tag: string, page = 1, limit = 12) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.post.findMany({
        where: { tags: { some: { name: tag.toLowerCase() } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { id: true, username: true, avatarUrl: true } },
          tags: { select: { name: true } },
          _count: { select: { likes: true, comments: true } },
        },
      }),
      this.prisma.post.count({
        where: { tags: { some: { name: tag.toLowerCase() } } },
      }),
    ]);

    return { data, total, page, limit, hasMore: skip + limit < total };
  }
}
