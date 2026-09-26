import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import { EstadosLookupService } from './estados-lookup.service.js';
import { PlantaLookupService } from './planta-lookup.service.js';

@Global()
@Module({
  providers: [PrismaService, EstadosLookupService, PlantaLookupService],
  exports: [PrismaService, EstadosLookupService, PlantaLookupService],
})
export class PrismaModule {}
