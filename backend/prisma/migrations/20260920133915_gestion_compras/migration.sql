-- AlterTable: email de contacto del usuario, para avisar por mail cuando
-- se procesa un requerimiento que cargo.
ALTER TABLE `usuarios` ADD COLUMN `email` VARCHAR(150) NULL;

-- Seed: estados del flujo de gestion de compras.
-- requerimiento: Activo (pendiente) -> Procesado (ya se genero una OC).
-- compra (OC): Autorizado (generada, sin enviar) -> Enviado a Proveedor
-- -> Recibido (definitivo). Anulado puede pasar desde Autorizado o
-- Enviado a Proveedor.
INSERT INTO `estados` (`nombreEstado`)
SELECT 'Procesado' WHERE NOT EXISTS (SELECT 1 FROM `estados` WHERE `nombreEstado` = 'Procesado');

INSERT INTO `estados` (`nombreEstado`)
SELECT 'Autorizado' WHERE NOT EXISTS (SELECT 1 FROM `estados` WHERE `nombreEstado` = 'Autorizado');

INSERT INTO `estados` (`nombreEstado`)
SELECT 'Enviado a Proveedor' WHERE NOT EXISTS (SELECT 1 FROM `estados` WHERE `nombreEstado` = 'Enviado a Proveedor');

INSERT INTO `estados` (`nombreEstado`)
SELECT 'Recibido' WHERE NOT EXISTS (SELECT 1 FROM `estados` WHERE `nombreEstado` = 'Recibido');

INSERT INTO `estados` (`nombreEstado`)
SELECT 'Anulado' WHERE NOT EXISTS (SELECT 1 FROM `estados` WHERE `nombreEstado` = 'Anulado');
