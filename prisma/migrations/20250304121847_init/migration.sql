-- CreateTable
CREATE TABLE `ClueScans` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clueId` INTEGER NOT NULL,
    `eventParticipationId` INTEGER NOT NULL,
    `scannedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Clues` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clue` VARCHAR(191) NOT NULL,
    `relatedToPreviousClueId` INTEGER NOT NULL,
    `qrcode` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TreasureHunt` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `eventParticipationId` INTEGER NOT NULL,
    `clue1Id` INTEGER NULL,
    `clue2Id` INTEGER NULL,
    `clue3Id` INTEGER NULL,
    `clue4Id` INTEGER NULL,

    UNIQUE INDEX `TreasureHunt_eventParticipationId_key`(`eventParticipationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ClueScans` ADD CONSTRAINT `ClueScans_clueId_fkey` FOREIGN KEY (`clueId`) REFERENCES `Clues`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ClueScans` ADD CONSTRAINT `ClueScans_eventParticipationId_fkey` FOREIGN KEY (`eventParticipationId`) REFERENCES `EventParticipant`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Clues` ADD CONSTRAINT `Clues_relatedToPreviousClueId_fkey` FOREIGN KEY (`relatedToPreviousClueId`) REFERENCES `Clues`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TreasureHunt` ADD CONSTRAINT `TreasureHunt_eventParticipationId_fkey` FOREIGN KEY (`eventParticipationId`) REFERENCES `EventParticipant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TreasureHunt` ADD CONSTRAINT `TreasureHunt_clue1Id_fkey` FOREIGN KEY (`clue1Id`) REFERENCES `Clues`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TreasureHunt` ADD CONSTRAINT `TreasureHunt_clue2Id_fkey` FOREIGN KEY (`clue2Id`) REFERENCES `Clues`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TreasureHunt` ADD CONSTRAINT `TreasureHunt_clue3Id_fkey` FOREIGN KEY (`clue3Id`) REFERENCES `Clues`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TreasureHunt` ADD CONSTRAINT `TreasureHunt_clue4Id_fkey` FOREIGN KEY (`clue4Id`) REFERENCES `Clues`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
