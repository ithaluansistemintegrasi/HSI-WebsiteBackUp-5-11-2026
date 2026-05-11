-- CreateTable
CREATE TABLE `SparepartCategory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NOT NULL,
    `nameId` VARCHAR(191) NOT NULL,
    `nameEn` VARCHAR(191) NULL,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SparepartCategory_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Sparepart` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `categoryId` INTEGER NOT NULL,
    `titleId` VARCHAR(191) NOT NULL,
    `titleEn` VARCHAR(191) NULL,
    `descId` VARCHAR(191) NULL,
    `descEn` VARCHAR(191) NULL,
    `price` INTEGER NOT NULL DEFAULT 0,
    `image` VARCHAR(191) NULL,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Sparepart_categoryId_idx`(`categoryId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Sparepart` ADD CONSTRAINT `Sparepart_categoryId_fkey` FOREIGN KEY (`categoryId`) REFERENCES `SparepartCategory`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
