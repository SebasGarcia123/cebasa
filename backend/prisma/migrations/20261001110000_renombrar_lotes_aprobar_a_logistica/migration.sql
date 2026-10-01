-- Último ajuste de nomenclatura: la aprobación de lotes de producción
-- la hace Logística (es su pantalla "Aprobación de Lotes de
-- Producción"), así que el permiso pasa a su familia, igual que se
-- hizo con el despacho de pedidos.
--
--   produccion.lotes_aprobar -> logistica.lotes_prod.aprobar
--
-- No confundir con logistica.lotes.aprobar, que es la aprobación de
-- los lotes propios de Logística.
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('logistica.lotes_prod.aprobar');

INSERT INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT rp.id_rol, p_new.id_permiso
FROM `rol_permisos` rp
JOIN `permisos` p_old ON p_old.id_permiso = rp.id_permiso AND p_old.nombre_permiso = 'produccion.lotes_aprobar'
JOIN `permisos` p_new ON p_new.nombre_permiso = 'logistica.lotes_prod.aprobar';

DELETE FROM `permisos` WHERE `nombre_permiso` = 'produccion.lotes_aprobar';
