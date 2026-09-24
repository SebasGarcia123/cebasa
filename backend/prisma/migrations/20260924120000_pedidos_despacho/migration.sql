-- AlterTable
ALTER TABLE `pedidos` ADD COLUMN `cantidad_copias` INTEGER NULL,
    ADD COLUMN `fecha_despacho` DATE NULL,
    ADD COLUMN `id_archivo_remito` INTEGER NULL,
    ADD COLUMN `id_deposito` INTEGER NULL,
    ADD COLUMN `motivo_anulacion` VARCHAR(255) NULL,
    ADD COLUMN `nro_nota_debito` VARCHAR(100) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `pedidos_id_archivo_remito_key` ON `pedidos`(`id_archivo_remito`);

-- CreateIndex
CREATE INDEX `fk_pedidos_deposito` ON `pedidos`(`id_deposito`);

-- Índice pendiente de una migración anterior (uq_receta_insumo cubre la
-- FK pero el índice declarado en el schema nunca se había creado).
CREATE INDEX `fk_receta_item_receta` ON `receta_item`(`id_receta`);

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `fk_pedidos_deposito` FOREIGN KEY (`id_deposito`) REFERENCES `deposito`(`id_deposito`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `pedidos` ADD CONSTRAINT `fk_pedidos_archivo_remito` FOREIGN KEY (`id_archivo_remito`) REFERENCES `archivo_adjunto`(`id_archivo_adjunto`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- Nuevos estados para el ciclo de vida del pedido: arranca "Cargado",
-- pasa a "Facturado" (Logística) y recién ahí se puede "Despachar"
-- (ver PedidosService). "Anulado" ya existía y sigue siendo válido
-- desde Cargado o Facturado.
INSERT INTO `estados` (`nombreEstado`) VALUES ('Cargado');
INSERT INTO `estados` (`nombreEstado`) VALUES ('Facturado');
INSERT INTO `estados` (`nombreEstado`) VALUES ('Despachado');

-- Tipo de movimiento para el egreso de stock que genera el despacho de
-- un pedido (los movimientos de producto existentes son de ingreso o
-- de consumo de producción, ninguno de salida a cliente).
INSERT INTO `tipo_movimiento` (`nombre_movimiento`, `id_naturaleza`, `id_estado`)
SELECT 'Despacho a cliente', n.id_naturaleza, e.id_estado
FROM `naturaleza` n, `estados` e
WHERE n.nombre_naturaleza = 'Salida' AND e.nombreEstado = 'Activo'
LIMIT 1;

-- División del sector Logística en Baradero/Caseros: se renombran las
-- filas existentes (siguen siendo el mismo id_sector, así que los
-- usuarios ya asignados no pierden nada) y se agregan las que faltan.
UPDATE `sectores` SET `nombreSector` = 'Logística Caseros' WHERE `nombreSector` = 'Logística';
UPDATE `sectores` SET `nombreSector` = 'Operario de Logística Caseros' WHERE `nombreSector` = 'Operario de Logística';
INSERT INTO `sectores` (`nombreSector`) VALUES ('Logística Baradero');
INSERT INTO `sectores` (`nombreSector`) VALUES ('Operario de Logística Baradero');

-- Los pedidos ya cargados con el modelo viejo (estado "Activo") pasan
-- al nuevo estado inicial "Cargado".
UPDATE `pedidos` p
JOIN `estados` e_old ON e_old.id_estado = p.id_estado AND e_old.nombreEstado = 'Activo'
JOIN `estados` e_new ON e_new.nombreEstado = 'Cargado'
SET p.id_estado = e_new.id_estado;
