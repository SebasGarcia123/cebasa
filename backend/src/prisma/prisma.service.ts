import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client.js';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    super({
      adapter: new PrismaMariaDb(process.env.DATABASE_URL!),
      // Nunca devolver el hash de la contraseña, ni siquiera cuando se
      // incluye la relación `usuarios` desde otra entidad (pedidos,
      // reclamos, etc.) — se filtró una vez por un include sin omit.
      omit: {
        usuarios: {
          password: true,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
