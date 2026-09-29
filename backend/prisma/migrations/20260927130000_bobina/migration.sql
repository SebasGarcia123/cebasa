-- CreateTable
CREATE TABLE `tipo_bobina` (
    `id_tipo_bobina` INTEGER NOT NULL AUTO_INCREMENT,
    `descripcion` VARCHAR(100) NOT NULL,

    PRIMARY KEY (`id_tipo_bobina`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `bobina` (
    `id_bobina` INTEGER NOT NULL AUTO_INCREMENT,
    `id_lote` INTEGER NOT NULL,
    `id_tipo_bobina` INTEGER NOT NULL,
    `id_producto` INTEGER NOT NULL,
    `peso` DECIMAL(10, 2) NOT NULL,
    `gramaje` DECIMAL(10, 2) NOT NULL,
    `id_usuario` INTEGER NOT NULL,
    `fecha_elaboracion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fk_bobina_lote`(`id_lote`),
    INDEX `fk_bobina_tipo_bobina`(`id_tipo_bobina`),
    INDEX `fk_bobina_producto`(`id_producto`),
    INDEX `fk_bobina_usuario`(`id_usuario`),
    PRIMARY KEY (`id_bobina`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `bobina` ADD CONSTRAINT `fk_bobina_lote` FOREIGN KEY (`id_lote`) REFERENCES `lote_prod`(`id_lote`) ON DELETE CASCADE ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `bobina` ADD CONSTRAINT `fk_bobina_tipo_bobina` FOREIGN KEY (`id_tipo_bobina`) REFERENCES `tipo_bobina`(`id_tipo_bobina`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `bobina` ADD CONSTRAINT `fk_bobina_producto` FOREIGN KEY (`id_producto`) REFERENCES `productos`(`id_producto`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE `bobina` ADD CONSTRAINT `fk_bobina_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE RESTRICT ON UPDATE RESTRICT;

-- Catálogo inicial de tipos de bobina.
INSERT INTO `tipo_bobina` (`descripcion`) VALUES ('Rollo de cocina sustentable');
INSERT INTO `tipo_bobina` (`descripcion`) VALUES ('Rollo de cocina Premium');
INSERT INTO `tipo_bobina` (`descripcion`) VALUES ('Papel higiénico sustentable');
INSERT INTO `tipo_bobina` (`descripcion`) VALUES ('Papel higiénico Premium');
INSERT INTO `tipo_bobina` (`descripcion`) VALUES ('Papel higiénico Sustentable Cliente');
