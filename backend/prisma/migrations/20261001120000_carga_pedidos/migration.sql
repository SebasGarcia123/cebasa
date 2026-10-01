-- Carga de pedidos por el operario de Logística (clarkista): el pedido
-- pasa a "Cargado" cuando subió al camión todos sus pallets, y recién
-- ahí el jefe de Logística lo puede despachar.

-- AlterTable
ALTER TABLE `productos` ADD COLUMN `tipo_pallet` ENUM('ANGOSTO', 'ANCHO_PESADO', 'ANCHO_LIVIANO') NULL;

-- CreateTable
CREATE TABLE `carga_pallet` (
    `id_carga_pallet` INTEGER NOT NULL AUTO_INCREMENT,
    `id_pedido` INTEGER NOT NULL,
    `id_item_pedido` INTEGER NOT NULL,
    `nro_pallet` INTEGER NOT NULL,
    `lado` ENUM('CONDUCTOR', 'ACOMPANANTE') NULL,
    `orden` INTEGER NULL,
    `cargado` BOOLEAN NOT NULL DEFAULT false,
    `fecha_carga` DATETIME(3) NULL,
    `id_usuario` INTEGER NULL,

    INDEX `fk_carga_pallet_pedido`(`id_pedido`),
    INDEX `fk_carga_pallet_item_pedido`(`id_item_pedido`),
    INDEX `fk_carga_pallet_usuario`(`id_usuario`),
    PRIMARY KEY (`id_carga_pallet`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `carga_pallet` ADD CONSTRAINT `fk_carga_pallet_pedido` FOREIGN KEY (`id_pedido`) REFERENCES `pedidos`(`id_pedido`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `carga_pallet` ADD CONSTRAINT `fk_carga_pallet_item_pedido` FOREIGN KEY (`id_item_pedido`) REFERENCES `item_pedido`(`id_item_pedido`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `carga_pallet` ADD CONSTRAINT `fk_carga_pallet_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- Estado nuevo del pedido, entre Facturado y Despachado.
INSERT INTO `estados` (`nombreEstado`) VALUES ('Cargado');

-- Permisos de la pantalla nueva (sin asignar: los asigna el admin).
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('logistica.carga_pedidos.ver');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('logistica.carga_pedidos.cargar');
