-- Fase 7 (última) de permisos por pantalla: Logística y Usuarios.
-- Reemplaza logistica.ver / logistica.editar y
-- usuarios.ver / usuarios.administrar por un permiso por pantalla, y
-- lleva logistica.lotes_aprobar a la nomenclatura de tres partes.

INSERT INTO `permisos` (`nombre_permiso`) VALUES ('logistica.fleteros.editar');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('logistica.tipo_lote.editar');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('logistica.autoelevadores.editar');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('logistica.control_autoelevador.editar');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('logistica.transporte.editar');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('logistica.lotes.ver');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('logistica.lotes.editar');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('logistica.lotes.aprobar');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('usuarios.usuarios.editar');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('usuarios.roles.editar');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('usuarios.permisos.editar');

-- Preservar accesos actuales (se poda después a mano, por pantalla).
INSERT INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT rp.id_rol, p_new.id_permiso
FROM `rol_permisos` rp
JOIN `permisos` p_old ON p_old.id_permiso = rp.id_permiso AND p_old.nombre_permiso = 'logistica.editar'
JOIN `permisos` p_new ON p_new.nombre_permiso IN (
  'logistica.fleteros.editar',
  'logistica.tipo_lote.editar',
  'logistica.autoelevadores.editar',
  'logistica.control_autoelevador.editar',
  'logistica.transporte.editar',
  'logistica.lotes.editar'
);

INSERT INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT rp.id_rol, p_new.id_permiso
FROM `rol_permisos` rp
JOIN `permisos` p_old ON p_old.id_permiso = rp.id_permiso AND p_old.nombre_permiso = 'logistica.ver'
JOIN `permisos` p_new ON p_new.nombre_permiso = 'logistica.lotes.ver';

INSERT INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT rp.id_rol, p_new.id_permiso
FROM `rol_permisos` rp
JOIN `permisos` p_old ON p_old.id_permiso = rp.id_permiso AND p_old.nombre_permiso = 'logistica.lotes_aprobar'
JOIN `permisos` p_new ON p_new.nombre_permiso = 'logistica.lotes.aprobar';

INSERT INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT rp.id_rol, p_new.id_permiso
FROM `rol_permisos` rp
JOIN `permisos` p_old ON p_old.id_permiso = rp.id_permiso AND p_old.nombre_permiso = 'usuarios.administrar'
JOIN `permisos` p_new ON p_new.nombre_permiso IN (
  'usuarios.usuarios.editar',
  'usuarios.roles.editar',
  'usuarios.permisos.editar'
);

-- Ya no los exige ningún controller (borra en cascada sus asignaciones).
DELETE FROM `permisos` WHERE `nombre_permiso` IN (
  'logistica.ver',
  'logistica.editar',
  'logistica.lotes_aprobar',
  'usuarios.ver',
  'usuarios.administrar'
);
