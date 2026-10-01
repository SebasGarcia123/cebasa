-- Fase 4 de permisos por pantalla: Comercial. Reemplaza el par
-- comercial.ver / comercial.editar (que habilitaba las 7 pantallas de
-- una) por un permiso por pantalla.
--
-- ABM (Clientes, Productos y los tres Tipo de...): un solo permiso
-- editar, que habilita ver y editar juntos y oculta el item del menú
-- sin él. Operativas (Pedidos, Reclamos): ver y editar separados,
-- porque conviven roles que solo consultan con roles que operan.
--
-- Los permisos de acción ya dedicados (comercial.pedidos_despachar,
-- comercial.pedidos_facturar, comercial.reclamos_resolver) no se tocan.

INSERT INTO `permisos` (`nombre_permiso`) VALUES ('comercial.clientes.editar');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('comercial.productos.editar');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('comercial.tipo_impacto.editar');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('comercial.tipo_documento.editar');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('comercial.tipo_producto.editar');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('comercial.pedidos.ver');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('comercial.pedidos.editar');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('comercial.reclamos.ver');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('comercial.reclamos.editar');

-- Preservar accesos actuales: lo que derivaba de comercial.editar
-- hereda de comercial.editar, y lo que derivaba de comercial.ver
-- hereda de comercial.ver (se poda después a mano, por pantalla).
INSERT INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT rp.id_rol, p_new.id_permiso
FROM `rol_permisos` rp
JOIN `permisos` p_old ON p_old.id_permiso = rp.id_permiso AND p_old.nombre_permiso = 'comercial.editar'
JOIN `permisos` p_new ON p_new.nombre_permiso IN (
  'comercial.clientes.editar',
  'comercial.productos.editar',
  'comercial.tipo_impacto.editar',
  'comercial.tipo_documento.editar',
  'comercial.tipo_producto.editar',
  'comercial.pedidos.editar',
  'comercial.reclamos.editar'
);

INSERT INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT rp.id_rol, p_new.id_permiso
FROM `rol_permisos` rp
JOIN `permisos` p_old ON p_old.id_permiso = rp.id_permiso AND p_old.nombre_permiso = 'comercial.ver'
JOIN `permisos` p_new ON p_new.nombre_permiso IN (
  'comercial.pedidos.ver',
  'comercial.reclamos.ver'
);

-- Ya no los exige ningún controller. El DELETE borra en cascada sus
-- filas de rol_permisos.
DELETE FROM `permisos` WHERE `nombre_permiso` IN ('comercial.ver', 'comercial.editar');
