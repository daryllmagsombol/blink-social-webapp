import { Controller, Post, Get, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('messages')
export class MessagesController {
  constructor(private messages: MessagesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  send(
    @CurrentUser('id') senderId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messages.send(senderId, dto.receiverId, dto.content);
  }

  @UseGuards(JwtAuthGuard)
  @Get('conversations')
  getConversations(@CurrentUser('id') userId: string) {
    return this.messages.getConversations(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':userId')
  getConversation(
    @CurrentUser('id') currentUserId: string,
    @Param('userId') otherUserId: string,
    @Query('page') page?: string,
  ) {
    return this.messages.getConversation(currentUserId, otherUserId, Math.max(1, Number(page) || 1));
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':userId/read')
  markAsRead(
    @CurrentUser('id') currentUserId: string,
    @Param('userId') otherUserId: string,
  ) {
    return this.messages.markAsRead(currentUserId, otherUserId);
  }
}
