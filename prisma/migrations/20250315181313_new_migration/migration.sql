/*
  Warnings:

  - A unique constraint covering the columns `[eventId,userId]` on the table `EventParticipant` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `clues` MODIFY `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AlterTable
ALTER TABLE `winnerclue` MODIFY `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX `EventParticipant_eventId_userId_key` ON `EventParticipant`(`eventId`, `userId`);
