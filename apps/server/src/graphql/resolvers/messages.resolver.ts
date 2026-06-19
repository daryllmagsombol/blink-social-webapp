import { Resolver, Query, Mutation, Subscription, Args, Context, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { MessagesService } from '../../messages/messages.service';
import { PubSubProvider } from '../providers/pubsub.provider';
import { GqlAuthGuard } from '../guards/gql-auth.guard';
import { GqlCurrentUser } from '../decorators/gql-current-user.decorator';
import { MessageEventType, PaginatedMessageType } from '../types/message.type';
import { ConversationType } from '../types/conversation.type';
import { MessageReadEventType } from '../types/read-receipt.type';
import { GRAPHQL_EVENTS } from '@social/shared';

@Resolver(() => MessageEventType)
export class MessagesResolver {
  constructor(
    private messagesService: MessagesService,
    private pubSub: PubSubProvider,
  ) {}

  @Query(() => [ConversationType])
  @UseGuards(GqlAuthGuard)
  async conversations(@GqlCurrentUser() user: { id: string }) {
    return this.messagesService.getConversations(user.id);
  }

  @Query(() => PaginatedMessageType)
  @UseGuards(GqlAuthGuard)
  async conversation(
    @Args('userId') otherUserId: string,
    @Args('page', { type: () => Int, nullable: true, defaultValue: 1 }) page: number,
    @GqlCurrentUser() user: { id: string },
  ) {
    return this.messagesService.getConversation(user.id, otherUserId, page);
  }

  @Mutation(() => MessageEventType)
  @UseGuards(GqlAuthGuard)
  async sendMessage(
    @Args('receiverId') receiverId: string,
    @Args('content') content: string,
    @GqlCurrentUser() user: { id: string },
  ) {
    const message = await this.messagesService.send(user.id, receiverId, content);

    // Publish to both sender and receiver via PubSub
    await this.pubSub.instance.publish(GRAPHQL_EVENTS.NEW_MESSAGE, {
      newMessage: message,
    });

    return message;
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async markAsRead(
    @Args('userId') otherUserId: string,
    @GqlCurrentUser() user: { id: string },
  ) {
    await this.messagesService.markAsRead(user.id, otherUserId);

    await this.pubSub.instance.publish(GRAPHQL_EVENTS.MESSAGE_READ, {
      messageRead: { userId: otherUserId, readBy: user.id },
    });

    return true;
  }

  @SkipThrottle()
  @Subscription(() => MessageEventType, {
    filter: (payload, variables, context) => {
      const message = payload.newMessage;
      const ctx = context as any;
      const user = ctx?.req?.user;
      if (!user?.id) return false;

      // Reject if the JWT used at connect time has expired
      if (user.exp && Date.now() / 1000 > user.exp) return false;

      // Only deliver to sender or receiver
      return message.senderId === user.id || message.receiverId === user.id;
    },
  })
  newMessage() {
    return this.pubSub.instance.asyncIterableIterator(GRAPHQL_EVENTS.NEW_MESSAGE);
  }

  @SkipThrottle()
  @Subscription(() => MessageReadEventType, {
    filter: (payload, variables, context) => {
      const { messageRead } = payload;
      const ctx = context as any;
      const user = ctx?.req?.user;
      if (!user?.id) return false;

      // Reject if the JWT used at connect time has expired
      if (user.exp && Date.now() / 1000 > user.exp) return false;

      // Notify the sender that their message was read
      return messageRead.userId === user.id;
    },
  })
  messageRead() {
    return this.pubSub.instance.asyncIterableIterator(GRAPHQL_EVENTS.MESSAGE_READ);
  }
}
