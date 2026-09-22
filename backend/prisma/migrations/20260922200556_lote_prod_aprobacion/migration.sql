-- AlterTable
ALTER TABLE `lote_prod` ADD COLUMN `motivo_rechazo` VARCHAR(255) NULL;

-- Nuevos estados para el flujo de aprobación de lotes de producción:
-- el alta pasa a arrancar en "Pendiente de aprobación" en vez de
-- "Activo", y Logística decide entre "Aprobado" y "Rechazado".
INSERT INTO `estados` (`nombreEstado`) VALUES ('Pendiente de aprobación');
INSERT INTO `estados` (`nombreEstado`) VALUES ('Aprobado');

-- Tipo de movimiento para el ingreso a stock que genera la aprobación
-- de un lote de producción (los tipos existentes son todos de salida).
INSERT INTO `naturaleza` (`nombre_naturaleza`) VALUES ('Entrada');

INSERT INTO `tipo_movimiento` (`nombre_movimiento`, `id_naturaleza`, `id_estado`)
SELECT 'Ingreso por producción', n.id_naturaleza, e.id_estado
FROM `naturaleza` n, `estados` e
WHERE n.nombre_naturaleza = 'Entrada' AND e.nombreEstado = 'Activo'
LIMIT 1;
