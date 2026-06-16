import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';

function parseTags(caption?: string): string[] {
  if (!caption) return [];
  const matches = caption.match(/#[\w]+/g);
  if (!matches) return [];
  return [...new Set(matches.map((t) => t.slice(1).toLowerCase()))];
}

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreatePostDto) {
    const tagNames = parseTags(dto.caption);

    if (tagNames.length > 0) {
      await Promise.all(
        tagNames.map((name) =>
          this.prisma.tag.upsert({
            where: { name },
            create: { name },
            update: {},
          }),
        ),
      );
    }

    return this.prisma.post.create({
      data: {
        userId,
        imageUrl: dto.imageUrl,
        caption: dto.caption,
        tags: {
          connect: tagNames.map((name) => ({ name })),
        },
      },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        tags: { select: { name: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });
  }

  async findById(id: string, viewerId?: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true, isPrivate: true } },
        tags: { select: { name: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });
    if (!post) throw new NotFoundException('Post not found');

    if (post.user.isPrivate && post.user.id !== viewerId) {
      if (!viewerId) throw new ForbiddenException('Post not available');
      const follow = await this.prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: viewerId, followingId: post.user.id } },
      });
      if (!follow) throw new ForbiddenException('Post not available');
    }

    return post;
  }

  async update(id: string, userId: string, caption?: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.userId !== userId) throw new NotFoundException('Post not found');

    const tagNames = caption ? parseTags(caption) : [];

    if (tagNames.length > 0) {
      await Promise.all(
        tagNames.map((name) =>
          this.prisma.tag.upsert({
            where: { name },
            create: { name },
            update: {},
          }),
        ),
      );
    }

    return this.prisma.post.update({
      where: { id },
      data: {
        ...(caption !== undefined && { caption }),
        tags: {
          set: [],
          connect: tagNames.map((name) => ({ name })),
        },
      },
      include: {
        user: { select: { id: true, username: true, avatarUrl: true } },
        tags: { select: { name: true } },
        _count: { select: { likes: true, comments: true } },
      },
    });
  }

  async delete(id: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.userId !== userId) throw new NotFoundException('Post not found');

    await this.prisma.post.delete({ where: { id } });
    return { success: true };
  }

  async getFeed(userId: string, page = 1, limit = 10) {
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId, status: 'ACCEPTED' },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);
    followingIds.push(userId);

    const blocked = await this.prisma.block.findMany({
      where: { blockerId: userId },
      select: { blockedId: true },
    });
    const blockedIds = blocked.map((b) => b.blockedId);

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.post.findMany({
        where: {
          userId: { in: followingIds },
          NOT: blockedIds.length > 0 ? { userId: { in: blockedIds } } : undefined,
        },
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
        where: {
          userId: { in: followingIds },
          NOT: blockedIds.length > 0 ? { userId: { in: blockedIds } } : undefined,
        },
      }),
    ]);

    const postIds = data.map((p) => p.id);

    const [likes, saves] = await Promise.all([
      this.prisma.like.findMany({
        where: { postId: { in: postIds }, userId },
        select: { postId: true },
      }),
      this.prisma.savedPost.findMany({
        where: { postId: { in: postIds }, userId },
        select: { postId: true },
      }),
    ]);
    const likedSet = new Set(likes.map((l) => l.postId));
    const savedSet = new Set(saves.map((s) => s.postId));

    const enriched = data.map((p) => ({
      ...p,
      isLiked: likedSet.has(p.id),
      isBookmarked: savedSet.has(p.id),
    }));

    return { data: enriched, total, page, limit, hasMore: skip + limit < total };
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
          tags: { select: { name: true } },
          _count: { select: { likes: true, comments: true } },
        },
      }),
      this.prisma.post.count(),
    ]);

    return { data, total, page, limit, hasMore: skip + limit < total };
  }

  async getUserPosts(userId: string, page = 1, limit = 12, viewerId?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { isPrivate: true } });

    let canView = true;
    if (user?.isPrivate && viewerId !== userId) {
      if (!viewerId) {
        canView = false;
      } else {
        const follow = await this.prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: viewerId, followingId: userId } },
        });
        canView = !!follow;
      }
    }

    if (!canView) {
      return { data: [], total: 0, page, limit, hasMore: false };
    }

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.post.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          tags: { select: { name: true } },
          _count: { select: { likes: true, comments: true } },
        },
      }),
      this.prisma.post.count({ where: { userId } }),
    ]);

    return { data, total, page, limit, hasMore: skip + limit < total };
  }
}
