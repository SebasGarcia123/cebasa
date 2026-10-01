-- Fase 5 de permisos por pantalla: Compras. Reemplaza el par
-- compras.ver / compras.editar por un permiso por pantalla.
--
-- Requerimientos es el caso particular: los carga cualquier sector que
-- necesite algo (Comercial, jefaturas de Producción y de Logística, y
-- mañana otros), y Compras los gestiona. Por eso el permiso de cargar
-- es propio y se asigna a varios perfiles, en vez de vivir en la
-- familia de un solo sector.
--
-- compras.gestionar_oc no se toca: ya es un permiso de acción
-- dedicado (generar OC, enviar a proveedor, recibir, anular).

INSERT INTO `permisos` (`nombre_permiso`) VALUES ('compras.proveedores.editar');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('compras.requerimientos.ver');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('compras.requerimientos.cargar');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('compras.gestion.ver');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('compras.gestion.editar');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('produccion.insumos.editar');

-- Preservar accesos actuales (se poda después a mano, por pantalla).
INSERT INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT rp.id_rol, p_new.id_permiso
FROM `rol_permisos` rp
JOIN `permisos` p_old ON p_old.id_permiso = rp.id_permiso AND p_old.nombre_permiso = 'compras.editar'
JOIN `permisos` p_new ON p_new.nombre_permiso IN (
  'compras.proveedores.editar',
  'compras.requerimientos.cargar',
  'compras.gestion.editar'
);

INSERT INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT rp.id_rol, p_new.id_permiso
FROM `rol_permisos` rp
JOIN `permisos` p_old ON p_old.id_permiso = rp.id_permiso AND p_old.nombre_permiso = 'compras.ver'
JOIN `permisos` p_new ON p_new.nombre_permiso IN (
  'compras.requerimientos.ver',
  'compras.gestion.ver'
);

-- Insumos vive en el módulo de Producción (produccion/insumo) aunque
-- en el menú aparezca bajo Compras, así que su permiso hereda de
-- produccion.editar. produccion.ver/produccion.editar siguen vivos
-- para el resto de Producción, todavía no migrado.
INSERT INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT rp.id_rol, p_new.id_permiso
FROM `rol_permisos` rp
JOIN `permisos` p_old ON p_old.id_permiso = rp.id_permiso AND p_old.nombre_permiso = 'produccion.editar'
JOIN `permisos` p_new ON p_new.nombre_permiso = 'produccion.insumos.editar';

-- Ya no los exige ningún controller (borra en cascada sus asignaciones).
DELETE FROM `permisos` WHERE `nombre_permiso` IN ('compras.ver', 'compras.editar');
