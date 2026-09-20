import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { diskStorage } from 'multer';
import type { Request } from 'express';

// uploads/ vive en la raíz del backend, junto a src/ y prisma/.
export const UPLOADS_DIR = join(fileURLToPath(new URL('.', import.meta.url)), '../../../../uploads');

if (!existsSync(UPLOADS_DIR)) {
  mkdirSync(UPLOADS_DIR, { recursive: true });
}

const TIPOS_PERMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

export const archivoAdjuntoMulterOptions = {
  storage: diskStorage({
    destination: UPLOADS_DIR,
    filename: (_req: Request, file: Express.Multer.File, callback: (error: Error | null, filename: string) => void) => {
      callback(null, `${randomUUID()}${extname(file.originalname)}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req: Request, file: Express.Multer.File, callback: (error: Error | null, accept: boolean) => void) => {
    if (!TIPOS_PERMITIDOS.has(file.mimetype)) {
      callback(new BadRequestException('Solo se permiten imágenes (JPG, PNG, WEBP) o PDF'), false);
      return;
    }
    callback(null, true);
  },
};
