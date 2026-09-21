-- AlterTable
ALTER TABLE `insumo` ADD COLUMN `stockeable` BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE `ajuste_stock` (
    `id_ajuste_stock` INTEGER NOT NULL AUTO_INCREMENT,
    `id_insumo` INTEGER NULL,
    `id_producto` INTEGER NULL,
    `id_usuario` INTEGER NOT NULL,
    `cantidad_anterior` INTEGER NOT NULL,
    `cantidad_nueva` INTEGER NOT NULL,
    `motivo` VARCHAR(255) NOT NULL,
    `fecha_ajuste` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fk_ajuste_stock_insumo`(`id_insumo`),
    INDEX `fk_ajuste_stock_producto`(`id_producto`),
    INDEX `fk_ajuste_stock_usuario`(`id_usuario`),
    PRIMARY KEY (`id_ajuste_stock`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ajuste_stock` ADD CONSTRAINT `fk_ajuste_stock_insumo` FOREIGN KEY (`id_insumo`) REFERENCES `insumo`(`id_insumo`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ajuste_stock` ADD CONSTRAINT `fk_ajuste_stock_producto` FOREIGN KEY (`id_producto`) REFERENCES `productos`(`id_producto`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `ajuste_stock` ADD CONSTRAINT `fk_ajuste_stock_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE RESTRICT ON UPDATE RESTRICT;
