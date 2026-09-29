-- CreateTable
CREATE TABLE `pallet` (
    `id_pallet` INTEGER NOT NULL AUTO_INCREMENT,
    `numero_lote` VARCHAR(20) NOT NULL,
    `id_lote` INTEGER NOT NULL,
    `id_producto` INTEGER NOT NULL,
    `id_lineas` INTEGER NOT NULL,
    `cantidad_bolsones` INTEGER NOT NULL,
    `id_usuario` INTEGER NOT NULL,
    `fecha_elaboracion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fk_pallet_lote`(`id_lote`),
    INDEX `fk_pallet_producto`(`id_producto`),
    INDEX `fk_pallet_lineas`(`id_lineas`),
    INDEX `fk_pallet_usuario`(`id_usuario`),
    PRIMARY KEY (`id_pallet`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `pallet` ADD CONSTRAINT `fk_pallet_lote` FOREIGN KEY (`id_lote`) REFERENCES `lote_prod`(`id_lote`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `pallet` ADD CONSTRAINT `fk_pallet_producto` FOREIGN KEY (`id_producto`) REFERENCES `productos`(`id_producto`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `pallet` ADD CONSTRAINT `fk_pallet_lineas` FOREIGN KEY (`id_lineas`) REFERENCES `lineas`(`id_lineas`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `pallet` ADD CONSTRAINT `fk_pallet_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE RESTRICT ON UPDATE RESTRICT;
