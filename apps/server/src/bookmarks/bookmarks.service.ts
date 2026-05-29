import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BookmarksService {
  constructor(private prisma: PrismaService) {}

  async toggle(userId: string, postId: string) {
    const existing = await this.prisma.savedPost.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      await this.prisma.savedPost.delete({ where: { id: existing.id } });
      return { saved: false };
    }

    await this.prisma.savedPost.create({
      data: { userId, postId },
    });
    return { saved: true };
  }

  async findByUser(userId: string, page = 1, limit = 12) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.savedPost.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          post: {
            include: {
              user: { select: { id: true, username: true, avatarUrl: true } },
              tags: { select: { name: true } },
              _count: { select: { likes: true, comments: true } },
            },
          },
        },
      }),
      this.prisma.savedPost.count({ where: { userId } }),
    ]);

    return { data: data.map((s) => s.post), total, page, limit, hasMore: skip + limit < total };
  }

  async check(userId: string, postId: string) {
    const existing = await this.prisma.savedPost.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    return { saved: !!existing };
  }
}
