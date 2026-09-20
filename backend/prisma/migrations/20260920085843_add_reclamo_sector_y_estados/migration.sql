-- AlterTable: se agrega nullable primero para poder rellenar las filas existentes
ALTER TABLE `reclamos` ADD COLUMN `id_sector` INTEGER NULL;

-- Backfill: los reclamos existentes quedan en el primer sector (Administracion)
UPDATE `reclamos` SET `id_sector` = (SELECT MIN(`id_sector`) FROM `sectores`) WHERE `id_sector` IS NULL;

ALTER TABLE `reclamos` MODIFY COLUMN `id_sector` INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX `fk_reclamos_sector` ON `reclamos`(`id_sector`);

-- AddForeignKey
ALTER TABLE `reclamos` ADD CONSTRAINT `fk_reclamos_sector` FOREIGN KEY (`id_sector`) REFERENCES `sectores`(`id_sector`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- Seed: estados que el sistema asigna automaticamente al resolver/rechazar un reclamo
INSERT INTO `estados` (`nombreEstado`)
SELECT 'Resuelto' WHERE NOT EXISTS (SELECT 1 FROM `estados` WHERE `nombreEstado` = 'Resuelto');

INSERT INTO `estados` (`nombreEstado`)
SELECT 'Rechazado' WHERE NOT EXISTS (SELECT 1 FROM `estados` WHERE `nombreEstado` = 'Rechazado');
