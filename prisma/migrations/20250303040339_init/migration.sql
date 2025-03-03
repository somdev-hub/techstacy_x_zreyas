-- AlterTable
ALTER TABLE `eventparticipant` ADD COLUMN `isConfirmed` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `mainParticipantId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `EventParticipant` ADD CONSTRAINT `EventParticipant_mainParticipantId_fkey` FOREIGN KEY (`mainParticipantId`) REFERENCES `EventParticipant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
