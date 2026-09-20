-- DropForeignKey
ALTER TABLE `productos` DROP FOREIGN KEY `fk_productos_archivo_adjunto`;

-- AddForeignKey
ALTER TABLE `productos` ADD CONSTRAINT `fk_productos_archivo_adjunto` FOREIGN KEY (`id_archivo_adjunto`) REFERENCES `archivo_adjunto`(`id_archivo_adjunto`) ON DELETE SET NULL ON UPDATE RESTRICT;
