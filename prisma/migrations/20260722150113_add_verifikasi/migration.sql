-- AlterTable
ALTER TABLE `attendances` ADD COLUMN `catatanVerifikasi` VARCHAR(191) NULL,
    ADD COLUMN `verifiedAt` DATETIME(3) NULL,
    ADD COLUMN `verifikasi` VARCHAR(191) NULL,
    ADD COLUMN `verifikasiById` VARCHAR(191) NULL,
    MODIFY `fotoCheckIn` MEDIUMTEXT NULL,
    MODIFY `fotoCheckOut` MEDIUMTEXT NULL;

-- AddForeignKey
ALTER TABLE `attendances` ADD CONSTRAINT `attendances_verifikasiById_fkey` FOREIGN KEY (`verifikasiById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
