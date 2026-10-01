-- AlterTable
ALTER TABLE `movimiento_insumo` ADD COLUMN `id_item_devolucion_insumo` INTEGER NULL;

-- CreateTable
CREATE TABLE `devolucion_insumos` (
    `id_devolucion_insumos` INTEGER NOT NULL AUTO_INCREMENT,
    `id_usuario` INTEGER NOT NULL,
    `fecha_carga` DATE NOT NULL,
    `id_estado` INTEGER NOT NULL,
    `motivo_rechazo` VARCHAR(255) NULL,

    INDEX `fk_devolucion_insumos_estado`(`id_estado`),
    INDEX `fk_devolucion_insumos_usuario`(`id_usuario`),
    PRIMARY KEY (`id_devolucion_insumos`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `item_devolucion_insumo` (
    `id_item_devolucion_insumo` INTEGER NOT NULL AUTO_INCREMENT,
    `id_devolucion_insumos` INTEGER NOT NULL,
    `id_insumo` INTEGER NOT NULL,
    `id_lineas` INTEGER NOT NULL,
    `cantidad` DECIMAL(10, 2) NOT NULL,

    INDEX `fk_item_devolucion_insumo_insumo`(`id_insumo`),
    INDEX `fk_item_devolucion_insumo_lineas`(`id_lineas`),
    INDEX `fk_item_devolucion_insumo_devolucion`(`id_devolucion_insumos`),
    PRIMARY KEY (`id_item_devolucion_insumo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `fk_mov_insumo_item_devolucion_insumo` ON `movimiento_insumo`(`id_item_devolucion_insumo`);

-- AddForeignKey
ALTER TABLE `movimiento_insumo` ADD CONSTRAINT `fk_mov_insumo_item_devolucion_insumo` FOREIGN KEY (`id_item_devolucion_insumo`) REFERENCES `item_devolucion_insumo`(`id_item_devolucion_insumo`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `devolucion_insumos` ADD CONSTRAINT `fk_devolucion_insumos_estado` FOREIGN KEY (`id_estado`) REFERENCES `estados`(`id_estado`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `devolucion_insumos` ADD CONSTRAINT `fk_devolucion_insumos_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `item_devolucion_insumo` ADD CONSTRAINT `fk_item_devolucion_insumo_insumo` FOREIGN KEY (`id_insumo`) REFERENCES `insumo`(`id_insumo`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `item_devolucion_insumo` ADD CONSTRAINT `fk_item_devolucion_insumo_lineas` FOREIGN KEY (`id_lineas`) REFERENCES `lineas`(`id_lineas`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `item_devolucion_insumo` ADD CONSTRAINT `fk_item_devolucion_insumo_devolucion` FOREIGN KEY (`id_devolucion_insumos`) REFERENCES `devolucion_insumos`(`id_devolucion_insumos`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- Nuevo tipo de movimiento para la devolución de insumos de Producción
-- a Logística (misma planta) — distinto de "Recepción de pedido de
-- insumos" (que va en sentido contrario) y de "Traslado interplanta"
-- (que es entre plantas, no entre sectores de la misma planta).
INSERT INTO `tipo_movimiento` (`nombre_movimiento`, `id_naturaleza`, `id_estado`)
SELECT 'Devolución de insumos a Logística', n.id_naturaleza, e.id_estado
FROM `naturaleza` n, `estados` e
WHERE n.nombre_naturaleza = 'Transferencia' AND e.nombreEstado = 'Activo'
LIMIT 1;

-- Permisos nuevos para Devolución de Insumos. Se crean sin asignar a
-- ningún rol: los asigna el admin manualmente (mismo criterio que los
-- de pedido_insumos.solicitar/.cumplir/.recibir).
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('devolucion_insumos.ver');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('devolucion_insumos.solicitar');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('devolucion_insumos.aprobar');
