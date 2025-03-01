/*
  Warnings:

  - A unique constraint covering the columns `[eventName]` on the table `Event` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Event_eventName_key` ON `Event`(`eventName`);
