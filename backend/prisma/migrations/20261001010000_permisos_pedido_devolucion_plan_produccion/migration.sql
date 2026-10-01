-- Fase 1 de permisos por pantalla: Pedido de Insumos, Devolución de
-- Insumos y Plan de Producción tenían permisos compartidos entre
-- Producción y Logística (pedido_insumos.ver sin distinguir audiencia)
-- o mezclados con otra familia (produccion.editar). Se reemplazan por
-- permisos propios por pantalla y por sector de quien actúa.

INSERT INTO `permisos` (`nombre_permiso`) VALUES ('produccion.pedido_insumos.ver');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('produccion.pedido_insumos.solicitar');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('produccion.pedido_insumos.recibir');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('logistica.pedido_insumos.ver');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('logistica.pedido_insumos.cumplir');

INSERT INTO `permisos` (`nombre_permiso`) VALUES ('produccion.devolucion_insumos.ver');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('produccion.devolucion_insumos.solicitar');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('logistica.devolucion_insumos.ver');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('logistica.devolucion_insumos.aprobar');

INSERT INTO `permisos` (`nombre_permiso`) VALUES ('produccion.plan_produccion.ver');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('produccion.plan_produccion.editar');

-- Preservar accesos actuales: todo rol que tenía el permiso viejo
-- hereda el/los nuevo(s) derivados de él, para no perder visibilidad
-- el día de la migración (se poda a mano después, por pantalla).
INSERT INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT rp.id_rol, p_new.id_permiso
FROM `rol_permisos` rp
JOIN `permisos` p_old ON p_old.id_permiso = rp.id_permiso AND p_old.nombre_permiso = 'pedido_insumos.ver'
JOIN `permisos` p_new ON p_new.nombre_permiso = 'produccion.pedido_insumos.ver';

INSERT INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT rp.id_rol, p_new.id_permiso
FROM `rol_permisos` rp
JOIN `permisos` p_old ON p_old.id_permiso = rp.id_permiso AND p_old.nombre_permiso = 'pedido_insumos.ver'
JOIN `permisos` p_new ON p_new.nombre_permiso = 'logistica.pedido_insumos.ver';

INSERT INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT rp.id_rol, p_new.id_permiso
FROM `rol_permisos` rp
JOIN `permisos` p_old ON p_old.id_permiso = rp.id_permiso AND p_old.nombre_permiso = 'devolucion_insumos.ver'
JOIN `permisos` p_new ON p_new.nombre_permiso = 'produccion.devolucion_insumos.ver';

INSERT INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT rp.id_rol, p_new.id_permiso
FROM `rol_permisos` rp
JOIN `permisos` p_old ON p_old.id_permiso = rp.id_permiso AND p_old.nombre_permiso = 'devolucion_insumos.ver'
JOIN `permisos` p_new ON p_new.nombre_permiso = 'logistica.devolucion_insumos.ver';

INSERT INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT rp.id_rol, p_new.id_permiso
FROM `rol_permisos` rp
JOIN `permisos` p_old ON p_old.id_permiso = rp.id_permiso AND p_old.nombre_permiso = 'pedido_insumos.ver'
JOIN `permisos` p_new ON p_new.nombre_permiso = 'produccion.plan_produccion.ver';

INSERT INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT rp.id_rol, p_new.id_permiso
FROM `rol_permisos` rp
JOIN `permisos` p_old ON p_old.id_permiso = rp.id_permiso AND p_old.nombre_permiso = 'produccion.editar'
JOIN `permisos` p_new ON p_new.nombre_permiso = 'produccion.plan_produccion.editar';

-- Permisos viejos: ningún controller los exige más. produccion.ver y
-- produccion.editar NO se tocan — los sigue usando el resto de las
-- pantallas de Producción, todavía no migradas a permisos propios.
-- El DELETE acá borra en cascada sus filas de rol_permisos.
DELETE FROM `permisos` WHERE `nombre_permiso` IN (
  'pedido_insumos.ver',
  'pedido_insumos.solicitar',
  'pedido_insumos.recibir',
  'pedido_insumos.cumplir',
  'pedido_insumos.editar',
  'devolucion_insumos.ver',
  'devolucion_insumos.solicitar',
  'devolucion_insumos.aprobar'
);
