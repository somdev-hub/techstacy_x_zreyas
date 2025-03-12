/*
  Warnings:

  - A unique constraint covering the columns `[tokenHash]` on the table `RefreshToken` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `tokenHash` to the `RefreshToken` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `RefreshToken_token_key` ON `refreshtoken`;

-- AlterTable
ALTER TABLE `refreshtoken` ADD COLUMN `tokenHash` VARCHAR(255) NOT NULL,
    MODIFY `token` TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `RefreshToken_tokenHash_key` ON `RefreshToken`(`tokenHash`);
