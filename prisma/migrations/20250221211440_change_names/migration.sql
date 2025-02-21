/*
  Warnings:

  - You are about to drop the column `promptsContainerId` on the `prompts` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `prompts` table. All the data in the column will be lost.
  - You are about to drop the `prompts_containers` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `chatId` to the `prompts` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "prompts" DROP CONSTRAINT "prompts_promptsContainerId_fkey";

-- DropForeignKey
ALTER TABLE "prompts" DROP CONSTRAINT "prompts_userId_fkey";

-- DropForeignKey
ALTER TABLE "prompts_containers" DROP CONSTRAINT "prompts_containers_userId_fkey";

-- DropIndex
DROP INDEX "prompts_userId_idx";

-- AlterTable
ALTER TABLE "prompts" DROP COLUMN "promptsContainerId",
DROP COLUMN "userId",
ADD COLUMN     "chatId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "prompts_containers";

-- CreateTable
CREATE TABLE "chats" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "chats_userId_idx" ON "chats"("userId");

-- CreateIndex
CREATE INDEX "prompts_chatId_idx" ON "prompts"("chatId");

-- AddForeignKey
ALTER TABLE "chats" ADD CONSTRAINT "chats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "chats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
