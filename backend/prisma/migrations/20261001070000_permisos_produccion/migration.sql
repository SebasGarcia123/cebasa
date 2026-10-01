-- Fase 6 de permisos por pantalla: Producción. Reemplaza el par
-- produccion.ver / produccion.editar (que habilitaba 13 pantallas de
-- una) por un permiso por pantalla.
--
-- Lotes de Producción es un solo módulo que atiende las cuatro
-- pantallas (Caseros/Baradero y jefe/operario), y la planta ya la
-- resuelve el sector del usuario, así que no se parte por planta sino
-- por quién hace qué:
--   lotes_prod.ver      -> leer el lote y sus bobinas/pallets/ítems
--   lotes_prod.editar   -> abrir, editar y cerrar el lote (jefe)
--   operario_prod.cargar-> generar bobinas, pallets e ítems (operario)
--   lotes_aprobar       -> sin cambios (lo aprueba Logística)

INSERT INTO `permisos` (`nombre_permiso`) VALUES ('produccion.depositos.editar');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('produccion.naturaleza.editar');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('produccion.lineas.editar');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('produccion.turnos.editar');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('produccion.tipo_movimiento.editar');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('produccion.tipo_bobina.editar');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('produccion.recetas.editar');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('produccion.movimientos_insumo.editar');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('produccion.movimientos_producto.editar');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('produccion.lotes_prod.ver');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('produccion.lotes_prod.editar');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('produccion.operario_prod.cargar');

-- Preservar accesos actuales (se poda después a mano, por pantalla).
INSERT INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT rp.id_rol, p_new.id_permiso
FROM `rol_permisos` rp
JOIN `permisos` p_old ON p_old.id_permiso = rp.id_permiso AND p_old.nombre_permiso = 'produccion.editar'
JOIN `permisos` p_new ON p_new.nombre_permiso IN (
  'produccion.depositos.editar',
  'produccion.naturaleza.editar',
  'produccion.lineas.editar',
  'produccion.turnos.editar',
  'produccion.tipo_movimiento.editar',
  'produccion.tipo_bobina.editar',
  'produccion.recetas.editar',
  'produccion.movimientos_insumo.editar',
  'produccion.movimientos_producto.editar',
  'produccion.lotes_prod.editar',
  'produccion.operario_prod.cargar'
);

INSERT INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT rp.id_rol, p_new.id_permiso
FROM `rol_permisos` rp
JOIN `permisos` p_old ON p_old.id_permiso = rp.id_permiso AND p_old.nombre_permiso = 'produccion.ver'
JOIN `permisos` p_new ON p_new.nombre_permiso = 'produccion.lotes_prod.ver';

-- Compras tiene que poder cargar insumos nuevos al sistema: el ABM de
-- Insumos vive en el menú de Compras pero su permiso heredó de
-- produccion.editar, que Compras no tenía.
INSERT INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT r.id_rol, p.id_permiso
FROM `roles` r, `permisos` p
WHERE p.nombre_permiso = 'produccion.insumos.editar'
  AND r.nombre_rol = 'Compras'
  AND NOT EXISTS (
    SELECT 1 FROM `rol_permisos` x WHERE x.id_rol = r.id_rol AND x.id_permiso = p.id_permiso
  );

-- Ya no los exige ningún controller (borra en cascada sus asignaciones).
DELETE FROM `permisos` WHERE `nombre_permiso` IN ('produccion.ver', 'produccion.editar');
