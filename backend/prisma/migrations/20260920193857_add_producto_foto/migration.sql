-- AlterTable
ALTER TABLE `productos` ADD COLUMN `id_archivo_adjunto` INTEGER NULL;

-- CreateIndex
CREATE INDEX `fk_productos_archivo_adjunto` ON `productos`(`id_archivo_adjunto`);

-- AddForeignKey
ALTER TABLE `productos` ADD CONSTRAINT `fk_productos_archivo_adjunto` FOREIGN KEY (`id_archivo_adjunto`) REFERENCES `archivo_adjunto`(`id_archivo_adjunto`) ON DELETE RESTRICT ON UPDATE RESTRICT;
