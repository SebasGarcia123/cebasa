import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { CatalogosModule } from './modules/catalogos/catalogos.module.js';
import { UsuariosModule } from './modules/usuarios/usuarios.module.js';
import { ComercialModule } from './modules/comercial/comercial.module.js';
import { ProduccionModule } from './modules/produccion/produccion.module.js';
import { LogisticaModule } from './modules/logistica/logistica.module.js';
import { ComprasModule } from './modules/compras/compras.module.js';
import { PedidoInsumosModule } from './modules/pedido-insumos/pedido-insumos.module.js';

@Module({
  imports: [
    PrismaModule,
    CatalogosModule,
    UsuariosModule,
    ComercialModule,
    ProduccionModule,
    LogisticaModule,
    ComprasModule,
    PedidoInsumosModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
