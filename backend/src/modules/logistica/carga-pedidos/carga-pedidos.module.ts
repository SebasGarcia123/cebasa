import { Module } from '@nestjs/common';
import { CargaPedidosService } from './carga-pedidos.service.js';
import { CargaPedidosController } from './carga-pedidos.controller.js';

@Module({
  controllers: [CargaPedidosController],
  providers: [CargaPedidosService],
})
export class CargaPedidosModule {}
