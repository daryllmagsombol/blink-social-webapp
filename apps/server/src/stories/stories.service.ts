import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StoriesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, imageUrl: string) {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    return this.prisma.story.create({
      data: { userId, imageUrl, expiresAt },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
      },
    });
  }

  async getFollowingStories(userId: string) {
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const ids = [...following.map((f) => f.followingId), userId];

    const stories = await this.prisma.story.findMany({
      where: {
        userId: { in: ids },
        expiresAt: { gt: new Date() },
      },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        views: {
          where: { viewerId: userId },
          select: { id: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const grouped: Record<string, { user: any; stories: any[] }> = {};
    for (const s of stories) {
      const key = s.userId;
      if (!grouped[key]) {
        grouped[key] = { user: s.user, stories: [] };
      }
      grouped[key].stories.push({
        id: s.id,
        imageUrl: s.imageUrl,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        viewed: s.views.length > 0,
      });
    }

    return Object.values(grouped);
  }

  async viewStory(storyId: string, viewerId: string) {
    const story = await this.prisma.story.findUnique({ where: { id: storyId } });
    if (!story) throw new NotFoundException('Story not found');

    const existing = await this.prisma.storyView.findUnique({
      where: { storyId_viewerId: { storyId, viewerId } },
    });
    if (existing) return { viewed: true };

    await this.prisma.storyView.create({
      data: { storyId, viewerId },
    });
  }

  async delete(id: string, userId: string) {
    const story = await this.prisma.story.findUnique({ where: { id } });
    if (!story) throw new NotFoundException('Story not found');
    if (story.userId !== userId) throw new NotFoundException('Story not found');
    await this.prisma.story.delete({ where: { id } });
    return { success: true };
  }

  async cleanupExpired() {
    await this.prisma.story.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}
