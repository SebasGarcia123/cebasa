-- stock.ajustar lo exige StockController desde que existe la pantalla
-- de Stock, pero nunca se creó la fila en `permisos`, así que no había
-- forma de asignárselo a un rol: solo funcionaba para el admin, que
-- saltea el chequeo. Se crea y se asigna al Jefe de Logística, que es
-- quien ajusta stock.
INSERT INTO `permisos` (`nombre_permiso`) VALUES ('stock.ajustar');

INSERT INTO `rol_permisos` (`id_rol`, `id_permiso`)
SELECT r.id_rol, p.id_permiso
FROM `roles` r, `permisos` p
WHERE p.nombre_permiso = 'stock.ajustar'
  AND r.nombre_rol = 'Jefe de Logística';
