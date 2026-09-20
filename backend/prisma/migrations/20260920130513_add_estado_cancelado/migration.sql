-- Seed: estado "Cancelado", usado por clientes (activo/cancelado). El
-- sistema lo asigna al editar un cliente; no hay ALTER TABLE porque
-- reutiliza el catalogo generico `estados` existente.
INSERT INTO `estados` (`nombreEstado`)
SELECT 'Cancelado' WHERE NOT EXISTS (SELECT 1 FROM `estados` WHERE `nombreEstado` = 'Cancelado');
