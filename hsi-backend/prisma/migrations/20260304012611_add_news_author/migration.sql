-- AlterTable
ALTER TABLE `news` ADD COLUMN `authorId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `News_authorId_idx` ON `News`(`authorId`);

-- AddForeignKey
ALTER TABLE `News` ADD CONSTRAINT `News_authorId_fkey` FOREIGN KEY (`authorId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
