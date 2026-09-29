-- AlterTable
ALTER TABLE `deposito` ADD COLUMN `planta` ENUM('CASEROS', 'BARADERO') NULL,
    ADD COLUMN `rol_deposito` ENUM('LOGISTICA', 'PRODUCCION') NULL;

-- AlterTable
ALTER TABLE `sectores` ADD COLUMN `planta` ENUM('CASEROS', 'BARADERO') NULL;

-- Backfill: clasifica los depósitos/sectores existentes por planta y
-- rol. A partir de acá el código lee estas columnas, no el nombre.
UPDATE `deposito` SET `planta` = 'CASEROS', `rol_deposito` = 'LOGISTICA' WHERE `nombre_deposito` = 'Logística Caseros';
UPDATE `deposito` SET `planta` = 'CASEROS', `rol_deposito` = 'PRODUCCION' WHERE `nombre_deposito` = 'Produccion Caseros';
UPDATE `deposito` SET `planta` = 'BARADERO', `rol_deposito` = 'LOGISTICA' WHERE `nombre_deposito` = 'Logística Baradero';
UPDATE `deposito` SET `planta` = 'BARADERO', `rol_deposito` = 'PRODUCCION' WHERE `nombre_deposito` = 'Produccion Baradero';

UPDATE `sectores` SET `planta` = 'CASEROS' WHERE `nombreSector` IN (
  'Logística Caseros', 'Operario de Logística Caseros', 'Producción Caseros', 'Operario de Producción Caseros'
);
UPDATE `sectores` SET `planta` = 'BARADERO' WHERE `nombreSector` IN (
  'Logística Baradero', 'Operario de Logística Baradero', 'Producción Baradero', 'Operario de Producción Baradero'
);
