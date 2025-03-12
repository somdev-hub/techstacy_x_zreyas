/*
  Warnings:

  - You are about to alter the column `token` on the `refreshtoken` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.
  - Added the required column `expiresAt` to the `RefreshToken` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `refreshtoken` ADD COLUMN `expiresAt` DATETIME(3) NOT NULL,
    MODIFY `token` VARCHAR(191) NOT NULL;
