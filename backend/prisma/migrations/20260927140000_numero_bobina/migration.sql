-- AlterTable
ALTER TABLE `bobina` ADD COLUMN `numero_bobina` VARCHAR(6) NOT NULL;

-- CreateTable
CREATE TABLE `bobina_secuencia` (
    `id` INTEGER NOT NULL,
    `prefijo` VARCHAR(2) NOT NULL,
    `numero` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `uq_bobina_numero_bobina` ON `bobina`(`numero_bobina`);

-- Fila única de la secuencia global de numeración de bobinas: arranca
-- en prefijo "AA", número 0 (la primera bobina generada será AA0001).
INSERT INTO `bobina_secuencia` (`id`, `prefijo`, `numero`) VALUES (1, 'AA', 0);
