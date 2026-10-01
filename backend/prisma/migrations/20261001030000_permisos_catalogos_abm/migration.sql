-- Fase 3 de permisos por pantalla: ABM de Catálogos (Estados, Sectores,
-- Unidad de Medida). En los ABM no hay permiso de ver separado: el
-- único permiso (editar) habilita ver y editar juntos; sin él, la
-- pantalla ni siquiera aparece en el menú. catalogos.editar sigue
-- vivo para Direcciones (sub-recurso de Clientes, sin pantalla propia
-- en el menú); produccion.ver/produccion.editar siguen vivos para el
-- resto de las pantallas de Producción todavía no migradas.
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('catalogos.estados.editar');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('catalogos.sectores.editar');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('produccion.unidad_medida.editar');

INSERT INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT rp.id_rol, p_new.id_permiso
FROM `rol_permisos` rp
JOIN `permisos` p_old ON p_old.id_permiso = rp.id_permiso AND p_old.nombre_permiso = 'catalogos.editar'
JOIN `permisos` p_new ON p_new.nombre_permiso = 'catalogos.estados.editar';

INSERT INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT rp.id_rol, p_new.id_permiso
FROM `rol_permisos` rp
JOIN `permisos` p_old ON p_old.id_permiso = rp.id_permiso AND p_old.nombre_permiso = 'catalogos.editar'
JOIN `permisos` p_new ON p_new.nombre_permiso = 'catalogos.sectores.editar';

INSERT INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT rp.id_rol, p_new.id_permiso
FROM `rol_permisos` rp
JOIN `permisos` p_old ON p_old.id_permiso = rp.id_permiso AND p_old.nombre_permiso = 'produccion.editar'
JOIN `permisos` p_new ON p_new.nombre_permiso = 'produccion.unidad_medida.editar';
