-- Reparación: en la fase 1 el permiso devolucion_insumos.solicitar se
-- renombró a produccion.devolucion_insumos.solicitar, pero el renombre
-- no copió su asignación (el Operario de Producción lo tenía) y el
-- DELETE del permiso viejo se la llevó en cascada. Se restaura.
INSERT INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT r.id_rol, p.id_permiso
FROM `roles` r, `permisos` p
WHERE p.nombre_permiso = 'produccion.devolucion_insumos.solicitar'
  AND r.nombre_rol = 'Operario de Producción'
  AND NOT EXISTS (
    SELECT 1 FROM `rol_permisos` x WHERE x.id_rol = r.id_rol AND x.id_permiso = p.id_permiso
  );
