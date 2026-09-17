import { Module } from '@nestjs/common';
import { EstadosModule } from './estados/estados.module.js';
import { SectoresModule } from './sectores/sectores.module.js';
import { DireccionesModule } from './direcciones/direcciones.module.js';

@Module({
  imports: [EstadosModule, SectoresModule, DireccionesModule],
})
export class CatalogosModule {}
