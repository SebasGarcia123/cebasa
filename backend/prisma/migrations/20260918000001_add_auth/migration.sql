-- AlterTable: add password column as nullable first (existing rows need a backfill)
ALTER TABLE `usuarios` ADD COLUMN `password` VARCHAR(255) NULL;

-- Backfill existing rows with a temporary bcrypt hash (dev seed data only).
-- Test user "jperez" temporary password: jperez123 — change it after first login.
UPDATE `usuarios` SET `password` = '$2b$10$dcO9GEoYNiYgXe/sO.U19uUugaPuTpaZDSOWHwUhSA245GkUSdJf.' WHERE `password` IS NULL;

-- Now enforce NOT NULL
ALTER TABLE `usuarios` MODIFY COLUMN `password` VARCHAR(255) NOT NULL;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id_refresh_token` INTEGER NOT NULL AUTO_INCREMENT,
    `token_hash` VARCHAR(255) NOT NULL,
    `id_usuario` INTEGER NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `revoked_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `uq_refresh_tokens_token_hash`(`token_hash`),
    INDEX `fk_refresh_tokens_usuario`(`id_usuario`),
    PRIMARY KEY (`id_refresh_token`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `uq_usuarios_nombre_usuario` ON `usuarios`(`nombre_usuario`);

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `fk_refresh_tokens_usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuarios`(`id_usuario`) ON DELETE CASCADE ON UPDATE RESTRICT;
