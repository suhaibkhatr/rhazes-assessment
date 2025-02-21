/*
  Warnings:

  - You are about to drop the column `content` on the `prompts_containers` table. All the data in the column will be lost.
  - Added the required column `prompt` to the `prompts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `response` to the `prompts` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `prompts_containers` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "prompts" ADD COLUMN     "prompt" TEXT NOT NULL,
ADD COLUMN     "response" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "prompts_containers" DROP COLUMN "content",
ADD COLUMN     "title" TEXT NOT NULL;
