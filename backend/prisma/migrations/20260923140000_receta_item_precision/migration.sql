-- Las cantidades de insumo por receta son chicas (ej. 0.04), y con solo
-- 2 decimales el redondeo genera un desvío grande al multiplicar por
-- las cantidades reales de producción. Se amplía a 4 decimales acá y
-- en el movimiento de insumo que genera la aprobación de un lote (ver
-- LoteProdService.aprobar), para no perder esa precisión en el camino.
ALTER TABLE `movimiento_insumo` MODIFY `cantidad` DECIMAL(10, 4) NOT NULL;
ALTER TABLE `receta_item` MODIFY `cantidad_utilizada` DECIMAL(10, 4) NOT NULL;

-- No se puede repetir el mismo insumo dos veces en una receta.
CREATE UNIQUE INDEX `uq_receta_insumo` ON `receta_item`(`id_receta`, `id_insumo`);
