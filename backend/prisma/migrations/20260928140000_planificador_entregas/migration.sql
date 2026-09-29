-- AlterTable
ALTER TABLE `pedidos` ADD COLUMN `fecha_salida_planificada` DATE NULL,
    ADD COLUMN `orden_planificador` INTEGER NULL;

-- Permisos nuevos del Planificador de Entregas. A propósito NO se
-- asignan acá a ningún rol: el usuario los asigna a mano desde
-- Usuarios > Roles.
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('planificador_entregas.ver');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('planificador_entregas.editar');
