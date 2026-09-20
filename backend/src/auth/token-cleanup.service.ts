import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service.js';

// Cuanto tiempo se conserva un refresh token ya revocado antes de
// borrarlo. No se borra apenas se revoca porque sirve para detectar reuso
// (alguien presentando un token ya rotado = señal de robo).
const REVOKED_RETENTION_DAYS = 7;

@Injectable()
export class TokenCleanupService {
  private readonly logger = new Logger(TokenCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async limpiarRefreshTokens(): Promise<void> {
    const retentionCutoff = new Date(Date.now() - REVOKED_RETENTION_DAYS * 24 * 60 * 60 * 1000);

    const { count } = await this.prisma.refresh_tokens.deleteMany({
      where: {
        OR: [{ expires_at: { lt: new Date() } }, { revoked_at: { lt: retentionCutoff } }],
      },
    });

    if (count > 0) {
      this.logger.log(`Se eliminaron ${count} refresh tokens vencidos/revocados`);
    }
  }
}
