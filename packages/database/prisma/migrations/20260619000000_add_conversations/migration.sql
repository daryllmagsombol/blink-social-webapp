-- CreateTable: Conversation
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ConversationParticipant
CREATE TABLE "ConversationParticipant" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Unique constraint on ConversationParticipant
CREATE UNIQUE INDEX "ConversationParticipant_conversationId_userId_key"
    ON "ConversationParticipant"("conversationId", "userId");

-- AlterTable: Add conversationId to Message (nullable)
ALTER TABLE "Message" ADD COLUMN "conversationId" TEXT;

-- CreateIndex: Message conversationId index
CREATE INDEX "Message_conversationId_idx" ON "Message"("conversationId");

-- CreateIndex: Message senderId-receiverId index
CREATE INDEX "Message_senderId_receiverId_idx" ON "Message"("senderId", "receiverId");

-- AddForeignKey: Message.conversationId -> Conversation.id
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey: ConversationParticipant.conversationId -> Conversation.id
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: ConversationParticipant.userId -> User.id
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
