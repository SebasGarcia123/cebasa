import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CompraService } from './compra.service.js';
import { CreateCompraDto } from './dto/create-compra.dto.js';
import { UpdateCompraDto } from './dto/update-compra.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';

@ApiTags('Compra')
@Controller('compras')
export class CompraController {
  constructor(private readonly compraService: CompraService) {}

  @RequirePermissions('compras.editar')
  @Post()
  create(@Body() dto: CreateCompraDto) {
    return this.compraService.create(dto);
  }

  @RequirePermissions('compras.ver')
  @Get()
  findAll() {
    return this.compraService.findAll();
  }

  @RequirePermissions('compras.ver')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.compraService.findOne(id);
  }

  @RequirePermissions('compras.editar')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCompraDto) {
    return this.compraService.update(id, dto);
  }

  @RequirePermissions('compras.editar')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.compraService.remove(id);
  }

  @RequirePermissions('compras.gestionar_oc')
  @Post(':id/enviar-proveedor')
  enviarProveedor(@Param('id', ParseIntPipe) id: number) {
    return this.compraService.enviarProveedor(id);
  }

  @RequirePermissions('compras.gestionar_oc')
  @Post(':id/recibir')
  recibir(@Param('id', ParseIntPipe) id: number) {
    return this.compraService.recibir(id);
  }

  @RequirePermissions('compras.gestionar_oc')
  @Post(':id/anular')
  anular(@Param('id', ParseIntPipe) id: number) {
    return this.compraService.anular(id);
  }
}
