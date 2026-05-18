CREATE TABLE `ProductItemProduct` (
  `productId` VARCHAR(191) NOT NULL,
  `itemId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `ProductItemProduct_itemId_idx`(`itemId`),
  PRIMARY KEY (`productId`, `itemId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ProductItemProduct`
  ADD CONSTRAINT `ProductItemProduct_productId_fkey`
  FOREIGN KEY (`productId`) REFERENCES `Product`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `ProductItemProduct`
  ADD CONSTRAINT `ProductItemProduct_itemId_fkey`
  FOREIGN KEY (`itemId`) REFERENCES `ProductItem`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

INSERT IGNORE INTO `ProductItemProduct` (`productId`, `itemId`)
SELECT `productId`, `id` FROM `ProductItem`;
