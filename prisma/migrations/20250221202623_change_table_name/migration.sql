/*
  Warnings:

  - You are about to drop the `messages` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `promptsContainerId` to the `prompts` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_promptId_fkey";

-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_userId_fkey";

-- AlterTable
ALTER TABLE "prompts" ADD COLUMN     "promptsContainerId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "messages";

-- CreateTable
CREATE TABLE "prompts_containers" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompts_containers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "prompts_containers_userId_idx" ON "prompts_containers"("userId");

-- AddForeignKey
ALTER TABLE "prompts_containers" ADD CONSTRAINT "prompts_containers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prompts" ADD CONSTRAINT "prompts_promptsContainerId_fkey" FOREIGN KEY ("promptsContainerId") REFERENCES "prompts_containers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
