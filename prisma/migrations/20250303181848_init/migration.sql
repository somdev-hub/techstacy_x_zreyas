/*
  Warnings:

  - A unique constraint covering the columns `[eventId,userId]` on the table `EventResult` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `EventResult_eventId_userId_key` ON `EventResult`(`eventId`, `userId`);
