import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import { EstadosLookupService } from './estados-lookup.service.js';

@Global()
@Module({
  providers: [PrismaService, EstadosLookupService],
  exports: [PrismaService, EstadosLookupService],
})
export class PrismaModule {}
