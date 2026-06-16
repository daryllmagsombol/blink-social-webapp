import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  async send(senderId: string, receiverId: string, content: string) {
    const block = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: senderId, blockedId: receiverId },
          { blockerId: receiverId, blockedId: senderId },
        ],
      },
    });

    if (block) throw new ForbiddenException('Cannot send message due to block');

    return this.prisma.message.create({
      data: { senderId, receiverId, content },
      include: {
        sender: { select: { id: true, username: true, avatarUrl: true } },
        receiver: { select: { id: true, username: true, avatarUrl: true } },
      },
    });
  }

  async getConversation(userId: string, otherUserId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: userId },
          ],
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          sender: { select: { id: true, username: true, avatarUrl: true } },
        },
      }),
      this.prisma.message.count({
        where: {
          OR: [
            { senderId: userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: userId },
          ],
        },
      }),
    ]);

    return { data: data.reverse(), total, page, limit, hasMore: skip + limit < total };
  }

  async markAsRead(userId: string, otherUserId: string) {
    await this.prisma.message.updateMany({
      where: {
        receiverId: userId,
        senderId: otherUserId,
        read: false,
      },
      data: { read: true },
    });

    return { success: true };
  }

  async getConversations(userId: string) {
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        sender: { select: { id: true, username: true, avatarUrl: true } },
        receiver: { select: { id: true, username: true, avatarUrl: true } },
      },
    });

    const otherUserIds = new Set<string>();
    for (const m of messages) {
      otherUserIds.add(m.senderId === userId ? m.receiverId : m.senderId);
    }

    const unreadCounts = await this.prisma.message.groupBy({
      by: ['senderId'],
      where: {
        receiverId: userId,
        read: false,
        senderId: { in: [...otherUserIds] },
      },
      _count: { id: true },
    });

    const unreadMap = new Map<string, number>();
    for (const row of unreadCounts) {
      unreadMap.set(row.senderId, row._count.id);
    }

    const convos: Record<string, { user: any; lastMessage: any; unread: number }> = {};
    for (const m of messages) {
      const otherId = m.senderId === userId ? m.receiverId : m.senderId;
      if (!convos[otherId]) {
        convos[otherId] = {
          user: m.senderId === userId ? m.receiver : m.sender,
          lastMessage: m,
          unread: unreadMap.get(otherId) || 0,
        };
      }
    }

    return Object.values(convos).sort(
      (a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime(),
    );
  }
}
