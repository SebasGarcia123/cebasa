-- AlterTable
ALTER TABLE `ajuste_stock` ADD COLUMN `id_deposito` INTEGER NULL;

-- Residuo del DEFAULT 0 temporal que se le puso a item_lote.cantidad en
-- la migración anterior (para no romper la fila de prueba existente
-- en ese momento); el schema no lo declara, se saca ahora.
ALTER TABLE `item_lote` ALTER COLUMN `cantidad` DROP DEFAULT;

-- CreateIndex
CREATE INDEX `fk_ajuste_stock_deposito` ON `ajuste_stock`(`id_deposito`);

-- AddForeignKey
ALTER TABLE `ajuste_stock` ADD CONSTRAINT `fk_ajuste_stock_deposito` FOREIGN KEY (`id_deposito`) REFERENCES `deposito`(`id_deposito`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- Backfill: el stock actual (productos.stock_actual) no tiene registro
-- de en qué depósito está físicamente. Por decisión del usuario, se
-- asigna todo a "Logística Caseros" como punto de partida limpio, y
-- de ahí en más cada movimiento (despacho, aprobación de lote de
-- producción, ajuste manual, lote interplanta) mantiene el desglose
-- real por depósito.
INSERT INTO `stock_producto_deposito` (`id_producto`, `id_deposito`, `cantidad`)
SELECT p.id_producto, d.id_deposito, p.stock_actual
FROM `productos` p, `deposito` d
WHERE p.stock_actual > 0 AND d.nombre_deposito = 'Logística Caseros';

-- stock_insumo_deposito ya tenía filas de pruebas de desarrollo (con
-- cantidades negativas, nunca reales) de antes de esta feature; se
-- limpian para arrancar de cero, ya que insumo.stock_actual está en 0
-- en todos los insumos (no hay nada real que backfillear ahí todavía).
DELETE FROM `stock_insumo_deposito`;
