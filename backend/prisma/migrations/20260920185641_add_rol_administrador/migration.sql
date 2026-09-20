-- AlterTable
ALTER TABLE `roles` ADD COLUMN `es_administrador` BOOLEAN NOT NULL DEFAULT false;

-- El rol "Admin" existente pasa a ser el rol con acceso total (bypass de
-- permisos y roles requeridos), para no dejar bloqueada la gestion de
-- permisos apenas se activa el control por endpoint.
UPDATE `roles` SET `es_administrador` = true WHERE `nombre_rol` = 'Admin';
