ALTER TABLE `Order`
  ADD COLUMN `paymentAccount` VARCHAR(191) NULL,
  ADD COLUMN `paymentTransactionId` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `Order_paymentTransactionId_key`
  ON `Order`(`paymentTransactionId`);
