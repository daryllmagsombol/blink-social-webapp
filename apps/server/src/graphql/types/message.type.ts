import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { UserType } from './user.type';

@ObjectType()
export class MessageEventType {
  @Field(() => ID)
  id: string;

  @Field()
  content: string;

  @Field()
  createdAt: Date;

  @Field()
  senderId: string;

  @Field(() => UserType)
  sender: UserType;

  @Field(() => UserType)
  receiver: UserType;

  @Field()
  read: boolean;
}

@ObjectType()
export class PaginatedMessageType {
  @Field(() => [MessageEventType])
  data: MessageEventType[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  limit: number;

  @Field()
  hasMore: boolean;
}
