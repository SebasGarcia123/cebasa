-- CreateTable
CREATE TABLE `dia_no_laborable` (
    `id_dia_no_laborable` INTEGER NOT NULL AUTO_INCREMENT,
    `id_plan_produccion` INTEGER NOT NULL,
    `fecha` DATE NOT NULL,
    `motivo` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `uq_dia_no_laborable_fecha`(`fecha`),
    INDEX `fk_dia_no_laborable_plan`(`id_plan_produccion`),
    PRIMARY KEY (`id_dia_no_laborable`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `dia_no_laborable` ADD CONSTRAINT `fk_dia_no_laborable_plan` FOREIGN KEY (`id_plan_produccion`) REFERENCES `plan_produccion`(`id_plan_produccion`) ON DELETE CASCADE ON UPDATE RESTRICT;
