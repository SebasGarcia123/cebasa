-- Toda nota de crédito o débito corrige una factura concreta, así que
-- la referencia pasa a ser obligatoria. Se puede agregar NOT NULL sin
-- backfill porque todavía no hay ninguna nota emitida.

-- AlterTable
ALTER TABLE `nota_credito` ADD COLUMN `id_factura` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `nota_debito` ADD COLUMN `id_factura` INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX `fk_nota_credito_factura` ON `nota_credito`(`id_factura`);

-- CreateIndex
CREATE INDEX `fk_nota_debito_factura` ON `nota_debito`(`id_factura`);

-- AddForeignKey
ALTER TABLE `nota_credito` ADD CONSTRAINT `fk_nota_credito_factura` FOREIGN KEY (`id_factura`) REFERENCES `factura`(`id_factura`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `nota_debito` ADD CONSTRAINT `fk_nota_debito_factura` FOREIGN KEY (`id_factura`) REFERENCES `factura`(`id_factura`) ON DELETE RESTRICT ON UPDATE RESTRICT;
