-- CreateTable
CREATE TABLE `News` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `slug` VARCHAR(191) NOT NULL,
    `titleId` VARCHAR(191) NOT NULL,
    `titleEn` VARCHAR(191) NULL,
    `excerptId` VARCHAR(191) NULL,
    `excerptEn` VARCHAR(191) NULL,
    `contentId` LONGTEXT NOT NULL,
    `contentEn` LONGTEXT NULL,
    `coverImage` VARCHAR(191) NULL,
    `publishedAt` DATETIME(3) NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `News_slug_key`(`slug`),
    INDEX `News_isActive_publishedAt_idx`(`isActive`, `publishedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
