import { Module } from '@nestjs/common';
import { ProveedorService } from './proveedor.service.js';
import { ProveedorController } from './proveedor.controller.js';

@Module({
  controllers: [ProveedorController],
  providers: [ProveedorService],
  exports: [ProveedorService],
})
export class ProveedorModule {}
