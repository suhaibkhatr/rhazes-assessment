/*
  Warnings:

  - You are about to drop the column `modelId` on the `prompts` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "prompts" DROP CONSTRAINT "prompts_modelId_fkey";

-- DropIndex
DROP INDEX "prompts_modelId_idx";

-- AlterTable
ALTER TABLE "prompts" DROP COLUMN "modelId",
ADD COLUMN     "modelName" TEXT NOT NULL DEFAULT 'GPT-4';
