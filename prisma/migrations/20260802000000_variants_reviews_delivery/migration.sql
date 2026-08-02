CREATE TABLE `ProductVariant` (
  `id` VARCHAR(191) NOT NULL, `productId` VARCHAR(191) NOT NULL, `name` VARCHAR(191) NOT NULL,
  `stock` INTEGER NOT NULL DEFAULT 0, `isSoldOut` BOOLEAN NOT NULL DEFAULT false, `position` INTEGER NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `ProductVariant_productId_name_key`(`productId`, `name`), INDEX `ProductVariant_productId_position_idx`(`productId`, `position`),
  PRIMARY KEY (`id`), CONSTRAINT `ProductVariant_productId_fkey` FOREIGN KEY (`productId`) REFERENCES `Product`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `Order` ADD COLUMN `stockRestoredAt` DATETIME(3) NULL, ADD COLUMN `deliveryZone` ENUM('INSIDE_DHAKA','OUTSIDE_DHAKA','SPECIAL') NOT NULL DEFAULT 'INSIDE_DHAKA';
ALTER TABLE `OrderItem` ADD COLUMN `variantId` VARCHAR(191) NULL, ADD COLUMN `variantName` VARCHAR(191) NULL;
ALTER TABLE `OrderItem` ADD INDEX `OrderItem_variantId_idx`(`variantId`);
ALTER TABLE `OrderItem` ADD CONSTRAINT `OrderItem_variantId_fkey` FOREIGN KEY (`variantId`) REFERENCES `ProductVariant`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Review` ADD COLUMN `orderItemId` VARCHAR(191) NULL;
CREATE UNIQUE INDEX `Review_orderItemId_key` ON `Review`(`orderItemId`);
ALTER TABLE `Review` ADD CONSTRAINT `Review_orderItemId_fkey` FOREIGN KEY (`orderItemId`) REFERENCES `OrderItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE `DeliveryCharge` (
  `id` VARCHAR(191) NOT NULL, `zone` ENUM('INSIDE_DHAKA','OUTSIDE_DHAKA','SPECIAL') NOT NULL, `label` VARCHAR(191) NOT NULL,
  `amount` DECIMAL(12,2) NOT NULL, `isEnabled` BOOLEAN NOT NULL DEFAULT true, `scheduledAmount` DECIMAL(12,2) NULL,
  `scheduledAt` DATETIME(3) NULL, `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3), `updatedAt` DATETIME(3) NOT NULL,
  UNIQUE INDEX `DeliveryCharge_zone_key`(`zone`), PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
INSERT INTO `DeliveryCharge` (`id`,`zone`,`label`,`amount`,`isEnabled`,`createdAt`,`updatedAt`) VALUES
('delivery-inside-dhaka','INSIDE_DHAKA','Inside Dhaka',60,true,NOW(3),NOW(3)),
('delivery-outside-dhaka','OUTSIDE_DHAKA','Outside Dhaka',120,true,NOW(3),NOW(3)),
('delivery-special','SPECIAL','Special delivery',0,false,NOW(3),NOW(3));
