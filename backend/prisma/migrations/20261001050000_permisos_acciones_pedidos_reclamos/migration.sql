-- Fase 4b: lleva los permisos de acción de Pedidos y Reclamos a la
-- nomenclatura de tres partes y a la familia de quien hace la acción:
--
--   comercial.pedidos_despachar -> logistica.pedidos.despachar
--       (la pantalla de Despacho la opera Logística, no Comercial)
--   comercial.pedidos_facturar  -> comercial.pedidos.facturar
--   comercial.reclamos_resolver -> comercial.reclamos.resolver
--
-- Reclamos queda en la familia comercial porque los carga Comercial,
-- pero los resuelven las tres jefaturas según la naturaleza del
-- reclamo, así que el permiso de resolver se suma también a Jefe de
-- Producción y Jefe de Logística.

INSERT INTO `permisos` (`nombre_permiso`) VALUES ('logistica.pedidos.despachar');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('comercial.pedidos.facturar');
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('comercial.reclamos.resolver');

-- Renombre puro: cada permiso nuevo arranca con las mismas
-- asignaciones que tenía el viejo.
INSERT INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT rp.id_rol, p_new.id_permiso
FROM `rol_permisos` rp
JOIN `permisos` p_old ON p_old.id_permiso = rp.id_permiso AND p_old.nombre_permiso = 'comercial.pedidos_despachar'
JOIN `permisos` p_new ON p_new.nombre_permiso = 'logistica.pedidos.despachar';

INSERT INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT rp.id_rol, p_new.id_permiso
FROM `rol_permisos` rp
JOIN `permisos` p_old ON p_old.id_permiso = rp.id_permiso AND p_old.nombre_permiso = 'comercial.pedidos_facturar'
JOIN `permisos` p_new ON p_new.nombre_permiso = 'comercial.pedidos.facturar';

INSERT INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT rp.id_rol, p_new.id_permiso
FROM `rol_permisos` rp
JOIN `permisos` p_old ON p_old.id_permiso = rp.id_permiso AND p_old.nombre_permiso = 'comercial.reclamos_resolver'
JOIN `permisos` p_new ON p_new.nombre_permiso = 'comercial.reclamos.resolver';

-- Resolver reclamos: además de Comercial, las jefaturas de Producción
-- y Logística (un reclamo de calidad lo resuelve Producción, uno de
-- entrega lo resuelve Logística).
INSERT INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT r.id_rol, p.id_permiso
FROM `roles` r, `permisos` p
WHERE p.nombre_permiso = 'comercial.reclamos.resolver'
  AND r.nombre_rol IN ('Jefe de Producción', 'Jefe de Logística')
  AND NOT EXISTS (
    SELECT 1 FROM `rol_permisos` x WHERE x.id_rol = r.id_rol AND x.id_permiso = p.id_permiso
  );

-- Ya no los exige ningún controller (borra en cascada sus asignaciones).
DELETE FROM `permisos` WHERE `nombre_permiso` IN (
  'comercial.pedidos_despachar',
  'comercial.pedidos_facturar',
  'comercial.reclamos_resolver'
);
