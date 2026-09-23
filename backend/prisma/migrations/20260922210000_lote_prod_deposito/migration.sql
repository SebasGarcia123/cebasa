-- AlterTable
-- DEFAULT 3 ("Produccion Baradero") solo para poder agregar la columna
-- NOT NULL sobre los lotes ya existentes; de acá en más el alta siempre
-- manda id_deposito explícito (ver CreateLoteProdDto), así que se saca
-- el default apenas se aplica.
ALTER TABLE `lote_prod` ADD COLUMN `id_deposito` INTEGER NOT NULL DEFAULT 3;
ALTER TABLE `lote_prod` ALTER COLUMN `id_deposito` DROP DEFAULT;

-- CreateIndex
CREATE INDEX `fk_lote_prod_deposito` ON `lote_prod`(`id_deposito`);

-- AddForeignKey
ALTER TABLE `lote_prod` ADD CONSTRAINT `fk_lote_prod_deposito` FOREIGN KEY (`id_deposito`) REFERENCES `deposito`(`id_deposito`) ON DELETE RESTRICT ON UPDATE RESTRICT;
