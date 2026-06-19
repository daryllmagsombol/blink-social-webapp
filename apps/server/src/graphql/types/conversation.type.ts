import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { UserType } from './user.type';
import { MessageEventType } from './message.type';

@ObjectType()
export class ConversationType {
  @Field(() => ID)
  id: string;

  @Field(() => UserType)
  otherUser: UserType;

  @Field(() => MessageEventType, { nullable: true })
  lastMessage?: MessageEventType;

  @Field(() => Int)
  unreadCount: number;

  @Field()
  updatedAt: Date;
}
