import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class MessageReadEventType {
  @Field()
  userId: string;

  @Field()
  readBy: string;
}
