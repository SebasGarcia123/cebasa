import { Module } from '@nestjs/common';
import { ClientesService } from './clientes.service.js';
import { ClientesController } from './clientes.controller.js';
import { CuentaCorrienteModule } from './cuenta-corriente/cuenta-corriente.module.js';
import { DocumentosModule } from './documentos/documentos.module.js';

@Module({
  imports: [CuentaCorrienteModule, DocumentosModule],
  controllers: [ClientesController],
  providers: [ClientesService],
  exports: [ClientesService],
})
export class ClientesModule {}
