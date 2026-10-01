-- Fase 2 de permisos por pantalla: Stock. Antes era de consulta libre
-- para cualquier usuario autenticado (sin permiso en el GET); ahora
-- exige stock.ver como el resto de las pantallas. Para no perder
-- acceso el día de la migración, se asigna a todos los roles
-- existentes (se poda después a mano, por rol).
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('stock.ver');

INSERT INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT r.id_rol, p.id_permiso
FROM `roles` r, `permisos` p
WHERE p.nombre_permiso = 'stock.ver';
