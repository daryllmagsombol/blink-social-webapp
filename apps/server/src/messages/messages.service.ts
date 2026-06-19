import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Find or create a conversation between two users.
   * Uses a deterministic conversation ID derived from sorted user IDs to prevent
   * duplicate conversations in concurrent send calls (TOCTOU race condition).
   */
  private async findOrCreateConversation(userId1: string, userId2: string) {
    // Deterministic ID: sorted user IDs ensure idempotency
    const sorted = [userId1, userId2].sort();
    const conversationId = `conv_${sorted[0]}_${sorted[1]}`;

    // Try find existing first (fast path)
    const existing = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { participants: true },
    });

    if (existing) return existing;

    // Create atomically — if two concurrent calls race, one will get P2002
    try {
      return await this.prisma.conversation.create({
        data: {
          id: conversationId,
          participants: {
            create: [
              { userId: userId1 },
              { userId: userId2 },
            ],
          },
        },
        include: { participants: true },
      });
    } catch (err: any) {
      // P2002 = unique constraint violation — another concurrent call created it first
      if (err?.code === 'P2002') {
        return this.prisma.conversation.findUniqueOrThrow({
          where: { id: conversationId },
          include: { participants: true },
        });
      }
      throw err;
    }
  }

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

    // Ensure a conversation exists
    const conversation = await this.findOrCreateConversation(senderId, receiverId);

    // Update the conversation timestamp
    await this.prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    return this.prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
        conversationId: conversation.id,
      },
      include: {
        sender: { select: { id: true, username: true, avatarUrl: true } },
        receiver: { select: { id: true, username: true, avatarUrl: true } },
      },
    });
  }

  async getConversation(userId: string, otherUserId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;

    const conversation = await this.prisma.conversation.findFirst({
      where: {
        participants: {
          every: {
            userId: { in: [userId, otherUserId] },
          },
        },
      },
    });

    if (!conversation) {
      return { data: [], total: 0, page, limit, hasMore: false };
    }

    const [data, total] = await Promise.all([
      this.prisma.message.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          sender: { select: { id: true, username: true, avatarUrl: true } },
          receiver: { select: { id: true, username: true, avatarUrl: true } },
        },
      }),
      this.prisma.message.count({
        where: { conversationId: conversation.id },
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
    // Get all conversations the user participates in, with last message and unread count
    const conversations = await this.prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId },
        },
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, username: true, avatarUrl: true },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true,
            read: true,
            sender: { select: { id: true, username: true, avatarUrl: true } },
            receiver: { select: { id: true, username: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Collect other user IDs for unread count
    const otherUserIds = conversations
      .map((c) => c.participants.find((p) => p.userId !== userId)?.userId)
      .filter(Boolean) as string[];

    // Get unread counts per sender
    const unreadCounts = await this.prisma.message.groupBy({
      by: ['senderId'],
      where: {
        receiverId: userId,
        read: false,
        senderId: { in: otherUserIds },
      },
      _count: { id: true },
    });

    const unreadMap = new Map<string, number>();
    for (const row of unreadCounts) {
      unreadMap.set(row.senderId, row._count.id);
    }

    return conversations.map((conversation) => {
      const otherParticipant = conversation.participants.find(
        (p) => p.userId !== userId,
      );
      const lastMessage = conversation.messages[0] || null;

      return {
        id: conversation.id,
        otherUser: otherParticipant?.user || { id: '', username: 'Unknown', avatarUrl: null },
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              createdAt: lastMessage.createdAt,
              senderId: lastMessage.senderId,
              sender: lastMessage.sender,
              receiver: lastMessage.receiver,
              read: lastMessage.read,
            }
          : null,
        unreadCount: unreadMap.get(otherParticipant?.userId || '') || 0,
        updatedAt: conversation.updatedAt,
      };
    });
  }
}
