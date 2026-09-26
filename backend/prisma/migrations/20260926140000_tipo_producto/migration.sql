-- CreateTable
CREATE TABLE `tipo_producto` (
    `id_tipo_producto` INTEGER NOT NULL AUTO_INCREMENT,
    `descripcion` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`id_tipo_producto`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `productos` ADD COLUMN `id_tipo_producto` INTEGER NULL;

-- CreateIndex
CREATE INDEX `fk_productos_tipo_producto` ON `productos`(`id_tipo_producto`);

-- AddForeignKey
ALTER TABLE `productos` ADD CONSTRAINT `fk_productos_tipo_producto` FOREIGN KEY (`id_tipo_producto`) REFERENCES `tipo_producto`(`id_tipo_producto`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- Catálogo inicial: pensado para indicadores futuros, por ahora se usa
-- para decidir "Kg" vs "Bolsones" en pedidos y remitos (Bobina = Kg).
INSERT INTO `tipo_producto` (`descripcion`) VALUES ('Bobina');
INSERT INTO `tipo_producto` (`descripcion`) VALUES ('Producto procesado');
INSERT INTO `tipo_producto` (`descripcion`) VALUES ('Producto tercerizado');
