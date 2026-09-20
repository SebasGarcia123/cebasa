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

@ApiTags('Compra')
@Controller('compras')
export class CompraController {
  constructor(private readonly compraService: CompraService) {}

  @Post()
  create(@Body() dto: CreateCompraDto) {
    return this.compraService.create(dto);
  }

  @Get()
  findAll() {
    return this.compraService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.compraService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCompraDto) {
    return this.compraService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.compraService.remove(id);
  }

  @Post(':id/enviar-proveedor')
  enviarProveedor(@Param('id', ParseIntPipe) id: number) {
    return this.compraService.enviarProveedor(id);
  }

  @Post(':id/recibir')
  recibir(@Param('id', ParseIntPipe) id: number) {
    return this.compraService.recibir(id);
  }

  @Post(':id/anular')
  anular(@Param('id', ParseIntPipe) id: number) {
    return this.compraService.anular(id);
  }
}
