/*
  Warnings:

  - You are about to drop the column `clue` on the `clues` table. All the data in the column will be lost.
  - You are about to drop the column `relatedToPreviousClueId` on the `clues` table. All the data in the column will be lost.
  - You are about to drop the column `clueId` on the `cluescans` table. All the data in the column will be lost.
  - You are about to drop the column `clue1Id` on the `treasurehunt` table. All the data in the column will be lost.
  - You are about to drop the column `clue2Id` on the `treasurehunt` table. All the data in the column will be lost.
  - You are about to drop the column `clue3Id` on the `treasurehunt` table. All the data in the column will be lost.
  - You are about to drop the column `clue4Id` on the `treasurehunt` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[cluesId]` on the table `TreasureHunt` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `finalClueId` to the `Clues` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstClueId` to the `Clues` table without a default value. This is not possible if the table is not empty.
  - Added the required column `secondClueId` to the `Clues` table without a default value. This is not possible if the table is not empty.
  - Added the required column `thirdClueId` to the `Clues` table without a default value. This is not possible if the table is not empty.
  - Added the required column `clueObjectId` to the `ClueScans` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cluesId` to the `TreasureHunt` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `clues` DROP FOREIGN KEY `Clues_relatedToPreviousClueId_fkey`;

-- DropForeignKey
ALTER TABLE `cluescans` DROP FOREIGN KEY `ClueScans_clueId_fkey`;

-- DropForeignKey
ALTER TABLE `treasurehunt` DROP FOREIGN KEY `TreasureHunt_clue1Id_fkey`;

-- DropForeignKey
ALTER TABLE `treasurehunt` DROP FOREIGN KEY `TreasureHunt_clue2Id_fkey`;

-- DropForeignKey
ALTER TABLE `treasurehunt` DROP FOREIGN KEY `TreasureHunt_clue3Id_fkey`;

-- DropForeignKey
ALTER TABLE `treasurehunt` DROP FOREIGN KEY `TreasureHunt_clue4Id_fkey`;

-- DropIndex
DROP INDEX `Clues_relatedToPreviousClueId_fkey` ON `clues`;

-- DropIndex
DROP INDEX `ClueScans_clueId_fkey` ON `cluescans`;

-- DropIndex
DROP INDEX `TreasureHunt_clue1Id_fkey` ON `treasurehunt`;

-- DropIndex
DROP INDEX `TreasureHunt_clue2Id_fkey` ON `treasurehunt`;

-- DropIndex
DROP INDEX `TreasureHunt_clue3Id_fkey` ON `treasurehunt`;

-- DropIndex
DROP INDEX `TreasureHunt_clue4Id_fkey` ON `treasurehunt`;

-- AlterTable
ALTER TABLE `clues` DROP COLUMN `clue`,
    DROP COLUMN `relatedToPreviousClueId`,
    ADD COLUMN `finalClueId` INTEGER NOT NULL,
    ADD COLUMN `firstClueId` INTEGER NOT NULL,
    ADD COLUMN `secondClueId` INTEGER NOT NULL,
    ADD COLUMN `thirdClueId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `cluescans` DROP COLUMN `clueId`,
    ADD COLUMN `clueObjectId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `treasurehunt` DROP COLUMN `clue1Id`,
    DROP COLUMN `clue2Id`,
    DROP COLUMN `clue3Id`,
    DROP COLUMN `clue4Id`,
    ADD COLUMN `cluesId` INTEGER NOT NULL;

-- CreateTable
CREATE TABLE `ClueObject` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clue` VARCHAR(191) NOT NULL,
    `qrCode` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `TreasureHunt_cluesId_key` ON `TreasureHunt`(`cluesId`);

-- AddForeignKey
ALTER TABLE `ClueScans` ADD CONSTRAINT `ClueScans_clueObjectId_fkey` FOREIGN KEY (`clueObjectId`) REFERENCES `ClueObject`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Clues` ADD CONSTRAINT `Clues_firstClueId_fkey` FOREIGN KEY (`firstClueId`) REFERENCES `ClueObject`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Clues` ADD CONSTRAINT `Clues_secondClueId_fkey` FOREIGN KEY (`secondClueId`) REFERENCES `ClueObject`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Clues` ADD CONSTRAINT `Clues_thirdClueId_fkey` FOREIGN KEY (`thirdClueId`) REFERENCES `ClueObject`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Clues` ADD CONSTRAINT `Clues_finalClueId_fkey` FOREIGN KEY (`finalClueId`) REFERENCES `ClueObject`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TreasureHunt` ADD CONSTRAINT `TreasureHunt_cluesId_fkey` FOREIGN KEY (`cluesId`) REFERENCES `Clues`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
