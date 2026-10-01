-- AlterTable: se agrega nullable primero para poder rellenar la única
-- fila existente (de pruebas manuales de la pantalla anterior) antes
-- de exigir NOT NULL.
ALTER TABLE `item_pedido_insumo` ADD COLUMN `id_lineas` INTEGER NULL,
    ADD COLUMN `observaciones` VARCHAR(255) NULL;

UPDATE `item_pedido_insumo` SET `id_lineas` = (SELECT id_lineas FROM lineas ORDER BY id_lineas LIMIT 1) WHERE `id_lineas` IS NULL;

ALTER TABLE `item_pedido_insumo` MODIFY COLUMN `id_lineas` INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX `fk_item_pedido_insumo_lineas` ON `item_pedido_insumo`(`id_lineas`);

-- AddForeignKey
ALTER TABLE `item_pedido_insumo` ADD CONSTRAINT `fk_item_pedido_insumo_lineas` FOREIGN KEY (`id_lineas`) REFERENCES `lineas`(`id_lineas`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- Estado nuevo para el flujo de pedido de insumos: Logística ya cargó
-- cantidades/observaciones, esperando que Producción decida Recibir o
-- mandar a revisar. Los demás estados del flujo (Pendiente, Rechazado,
-- Recibido, Anulado) ya existen en el catálogo genérico.
INSERT INTO `estados` (`nombreEstado`) VALUES ('Cumplido');

-- Tipo de movimiento propio para el traslado Logística -> Producción
-- al recibir un pedido de insumos (no reutiliza "Traslado interplanta"
-- porque ese es entre depósitos de distinta planta; este es siempre
-- dentro de la misma planta).
INSERT INTO `tipo_movimiento` (`nombre_movimiento`, `id_naturaleza`, `id_estado`)
SELECT 'Recepción de pedido de insumos', n.id_naturaleza, e.id_estado
FROM `naturaleza` n, `estados` e
WHERE n.nombre_naturaleza = 'Transferencia' AND e.nombreEstado = 'Activo'
LIMIT 1;

-- Permisos nuevos del flujo de Pedido de Insumos. A propósito NO se
-- asignan acá a ningún rol: el usuario los asigna a mano desde
-- Usuarios > Roles.
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('pedido_insumos.solicitar');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('pedido_insumos.cumplir');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('pedido_insumos.recibir');
