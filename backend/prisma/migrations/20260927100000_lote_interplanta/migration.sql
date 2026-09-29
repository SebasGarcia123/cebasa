-- DropForeignKey
ALTER TABLE `item_lote` DROP FOREIGN KEY `fk_item_lote_unidad_medida`;

-- DropIndex
DROP INDEX `fk_item_lote_unidad_medida` ON `item_lote`;

-- AlterTable: item_lote deja de ser texto libre y pasa a referenciar
-- stock real (producto o insumo), para que LotesService.aprobar pueda
-- trasladarlo entre depósitos. `cantidad` lleva DEFAULT 0 temporal
-- (no NOT NULL a secas) porque ya existe una fila de prueba cargada a
-- mano contra el modelo viejo; queda huérfana (sin producto/insumo)
-- pero no bloquea el ALTER — es dato de prueba, no de producción.
ALTER TABLE `item_lote` DROP COLUMN `cantidad_item_lote`,
    DROP COLUMN `descripcion_item`,
    DROP COLUMN `id_unidad_medida`,
    ADD COLUMN `cantidad` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `id_insumo` INTEGER NULL,
    ADD COLUMN `id_producto` INTEGER NULL;

-- AlterTable: lotes gana depósito origen/destino (para el traslado
-- interplanta), fecha de despacho, y motivo_rechazo reemplaza al
-- ambiguo `motivo` de antes (nunca tuvo un propósito claro).
ALTER TABLE `lotes` DROP COLUMN `motivo`,
    ADD COLUMN `fecha_despacho` DATE NULL,
    ADD COLUMN `id_deposito_destino` INTEGER NULL,
    ADD COLUMN `id_deposito_origen` INTEGER NULL,
    ADD COLUMN `motivo_rechazo` VARCHAR(255) NULL;

-- CreateTable: desglose de stock de productos terminados por depósito
-- (antes solo existía para insumos). productos.stock_actual sigue
-- siendo el total cacheado; esta tabla dice cuánto hay en cada planta.
CREATE TABLE `stock_producto_deposito` (
    `id_stock_producto_deposito` INTEGER NOT NULL AUTO_INCREMENT,
    `id_producto` INTEGER NOT NULL,
    `id_deposito` INTEGER NOT NULL,
    `cantidad` INTEGER NOT NULL DEFAULT 0,

    INDEX `fk_stock_producto_dep_deposito`(`id_deposito`),
    UNIQUE INDEX `uq_producto_deposito`(`id_producto`, `id_deposito`),
    PRIMARY KEY (`id_stock_producto_deposito`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `fk_item_lote_producto` ON `item_lote`(`id_producto`);

-- CreateIndex
CREATE INDEX `fk_item_lote_insumo` ON `item_lote`(`id_insumo`);

-- CreateIndex
CREATE INDEX `fk_lotes_deposito_origen` ON `lotes`(`id_deposito_origen`);

-- CreateIndex
CREATE INDEX `fk_lotes_deposito_destino` ON `lotes`(`id_deposito_destino`);

-- AddForeignKey
ALTER TABLE `item_lote` ADD CONSTRAINT `fk_item_lote_producto` FOREIGN KEY (`id_producto`) REFERENCES `productos`(`id_producto`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `item_lote` ADD CONSTRAINT `fk_item_lote_insumo` FOREIGN KEY (`id_insumo`) REFERENCES `insumo`(`id_insumo`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `lotes` ADD CONSTRAINT `fk_lotes_deposito_origen` FOREIGN KEY (`id_deposito_origen`) REFERENCES `deposito`(`id_deposito`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `lotes` ADD CONSTRAINT `fk_lotes_deposito_destino` FOREIGN KEY (`id_deposito_destino`) REFERENCES `deposito`(`id_deposito`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `stock_producto_deposito` ADD CONSTRAINT `fk_stock_producto_dep_deposito` FOREIGN KEY (`id_deposito`) REFERENCES `deposito`(`id_deposito`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `stock_producto_deposito` ADD CONSTRAINT `fk_stock_producto_dep_producto` FOREIGN KEY (`id_producto`) REFERENCES `productos`(`id_producto`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- Naturaleza nueva para el tipo de movimiento de traslado: no es
-- puramente Entrada ni Salida (un solo movimiento_producto/movimiento_insumo
-- con origen Y destino representa el traslado completo).
INSERT INTO `naturaleza` (`nombre_naturaleza`) VALUES ('Transferencia');

INSERT INTO `tipo_movimiento` (`nombre_movimiento`, `id_naturaleza`, `id_estado`)
SELECT 'Traslado interplanta', n.id_naturaleza, e.id_estado
FROM `naturaleza` n, `estados` e
WHERE n.nombre_naturaleza = 'Transferencia' AND e.nombreEstado = 'Activo'
LIMIT 1;

-- Permiso para aprobar/rechazar lotes interplanta, separado de
-- logistica.editar (mismo criterio que produccion.lotes_aprobar):
-- quien carga el lote no necesariamente puede aprobarlo, esa
-- distinción la hace el service por planta, no el permiso en sí.
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('logistica.lotes_aprobar');

INSERT INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT r.id_rol, p.id_permiso
FROM `roles` r, `permisos` p
WHERE r.nombre_rol = 'Jefe de Logística' AND p.nombre_permiso = 'logistica.lotes_aprobar';
