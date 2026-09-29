-- AlterTable
ALTER TABLE `cuenta_corriente` ADD COLUMN `saldo_actual` DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

-- AlterTable
ALTER TABLE `movimiento_cuenta_corriente` ADD COLUMN `id_factura` INTEGER NULL,
    ADD COLUMN `id_nota_credito` INTEGER NULL,
    ADD COLUMN `id_nota_debito` INTEGER NULL,
    ADD COLUMN `id_recibo` INTEGER NULL;

-- CreateTable
CREATE TABLE `factura` (
    `id_factura` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha` DATE NOT NULL,
    `id_cliente` INTEGER NOT NULL,
    `id_pedido` INTEGER NOT NULL,
    `monto` DECIMAL(12, 2) NOT NULL,
    `id_archivo` INTEGER NULL,

    UNIQUE INDEX `factura_id_pedido_key`(`id_pedido`),
    UNIQUE INDEX `factura_id_archivo_key`(`id_archivo`),
    INDEX `fk_factura_cliente`(`id_cliente`),
    PRIMARY KEY (`id_factura`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `recibo` (
    `id_recibo` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha` DATE NOT NULL,
    `id_cliente` INTEGER NOT NULL,
    `monto` DECIMAL(12, 2) NOT NULL,
    `medio_pago` VARCHAR(50) NOT NULL,
    `observaciones` VARCHAR(255) NULL,
    `id_archivo` INTEGER NULL,

    UNIQUE INDEX `recibo_id_archivo_key`(`id_archivo`),
    INDEX `fk_recibo_cliente`(`id_cliente`),
    PRIMARY KEY (`id_recibo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `nota_credito` (
    `id_nota_credito` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha` DATE NOT NULL,
    `id_cliente` INTEGER NOT NULL,
    `monto` DECIMAL(12, 2) NOT NULL,
    `motivo` VARCHAR(255) NOT NULL,
    `id_archivo` INTEGER NULL,

    UNIQUE INDEX `nota_credito_id_archivo_key`(`id_archivo`),
    INDEX `fk_nota_credito_cliente`(`id_cliente`),
    PRIMARY KEY (`id_nota_credito`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `nota_debito` (
    `id_nota_debito` INTEGER NOT NULL AUTO_INCREMENT,
    `fecha` DATE NOT NULL,
    `id_cliente` INTEGER NOT NULL,
    `monto` DECIMAL(12, 2) NOT NULL,
    `motivo` VARCHAR(255) NOT NULL,
    `id_archivo` INTEGER NULL,

    UNIQUE INDEX `nota_debito_id_archivo_key`(`id_archivo`),
    INDEX `fk_nota_debito_cliente`(`id_cliente`),
    PRIMARY KEY (`id_nota_debito`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `movimiento_cuenta_corriente_id_factura_key` ON `movimiento_cuenta_corriente`(`id_factura`);

-- CreateIndex
CREATE UNIQUE INDEX `movimiento_cuenta_corriente_id_recibo_key` ON `movimiento_cuenta_corriente`(`id_recibo`);

-- CreateIndex
CREATE UNIQUE INDEX `movimiento_cuenta_corriente_id_nota_credito_key` ON `movimiento_cuenta_corriente`(`id_nota_credito`);

-- CreateIndex
CREATE UNIQUE INDEX `movimiento_cuenta_corriente_id_nota_debito_key` ON `movimiento_cuenta_corriente`(`id_nota_debito`);

-- AddForeignKey
ALTER TABLE `factura` ADD CONSTRAINT `fk_factura_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `clientes`(`id_cliente`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `factura` ADD CONSTRAINT `fk_factura_pedido` FOREIGN KEY (`id_pedido`) REFERENCES `pedidos`(`id_pedido`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `factura` ADD CONSTRAINT `fk_factura_archivo` FOREIGN KEY (`id_archivo`) REFERENCES `archivo_adjunto`(`id_archivo_adjunto`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `recibo` ADD CONSTRAINT `fk_recibo_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `clientes`(`id_cliente`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `recibo` ADD CONSTRAINT `fk_recibo_archivo` FOREIGN KEY (`id_archivo`) REFERENCES `archivo_adjunto`(`id_archivo_adjunto`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `nota_credito` ADD CONSTRAINT `fk_nota_credito_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `clientes`(`id_cliente`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `nota_credito` ADD CONSTRAINT `fk_nota_credito_archivo` FOREIGN KEY (`id_archivo`) REFERENCES `archivo_adjunto`(`id_archivo_adjunto`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `nota_debito` ADD CONSTRAINT `fk_nota_debito_cliente` FOREIGN KEY (`id_cliente`) REFERENCES `clientes`(`id_cliente`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `nota_debito` ADD CONSTRAINT `fk_nota_debito_archivo` FOREIGN KEY (`id_archivo`) REFERENCES `archivo_adjunto`(`id_archivo_adjunto`) ON DELETE SET NULL ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `movimiento_cuenta_corriente` ADD CONSTRAINT `fk_movimiento_cta_cte_factura` FOREIGN KEY (`id_factura`) REFERENCES `factura`(`id_factura`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `movimiento_cuenta_corriente` ADD CONSTRAINT `fk_movimiento_cta_cte_recibo` FOREIGN KEY (`id_recibo`) REFERENCES `recibo`(`id_recibo`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `movimiento_cuenta_corriente` ADD CONSTRAINT `fk_movimiento_cta_cte_nota_credito` FOREIGN KEY (`id_nota_credito`) REFERENCES `nota_credito`(`id_nota_credito`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `movimiento_cuenta_corriente` ADD CONSTRAINT `fk_movimiento_cta_cte_nota_debito` FOREIGN KEY (`id_nota_debito`) REFERENCES `nota_debito`(`id_nota_debito`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- El catálogo tipo_impacto solo tenía "Debito" (usado por Factura).
-- Se agrega "Credito" y los tres tipo_documento nuevos: Recibo y Nota
-- de Crédito impactan en Crédito (reducen deuda), Nota de Débito en
-- Débito (aumenta deuda), igual que Factura.
INSERT INTO `tipo_impacto` (`descripcion`) VALUES ('Credito');

INSERT INTO `tipo_documento` (`descripcion`, `id_tipo_impacto`)
  SELECT 'Recibo', `id_tipo_impacto` FROM `tipo_impacto` WHERE `descripcion` = 'Credito';
INSERT INTO `tipo_documento` (`descripcion`, `id_tipo_impacto`)
  SELECT 'Nota de Crédito', `id_tipo_impacto` FROM `tipo_impacto` WHERE `descripcion` = 'Credito';
INSERT INTO `tipo_documento` (`descripcion`, `id_tipo_impacto`)
  SELECT 'Nota de Débito', `id_tipo_impacto` FROM `tipo_impacto` WHERE `descripcion` = 'Debito';
