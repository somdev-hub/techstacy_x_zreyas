/*
  Warnings:

  - You are about to alter the column `year` on the `user` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(0))`.

*/
-- AlterTable
ALTER TABLE `user` MODIFY `college` VARCHAR(191) NOT NULL DEFAULT 'Silicon Institute of Technology, Sambalpur',
    MODIFY `year` ENUM('FIRST_YEAR', 'SECOND_YEAR', 'THIRD_YEAR', 'FOURTH_YEAR') NOT NULL,
    MODIFY `imageUrl` VARCHAR(191) NULL;
