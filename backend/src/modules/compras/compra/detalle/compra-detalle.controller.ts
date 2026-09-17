import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { CompraDetalleService } from './compra-detalle.service.js';
import { CreateCompraDetalleDto } from './dto/create-compra-detalle.dto.js';
import { UpdateCompraDetalleDto } from './dto/update-compra-detalle.dto.js';

@Controller('compras/:idCompra/detalle')
export class CompraDetalleController {
  constructor(private readonly detalleService: CompraDetalleService) {}

  @Get()
  findAll(@Param('idCompra', ParseIntPipe) idCompra: number) {
    return this.detalleService.findAllForCompra(idCompra);
  }

  @Post()
  create(@Param('idCompra', ParseIntPipe) idCompra: number, @Body() dto: CreateCompraDetalleDto) {
    return this.detalleService.create(idCompra, dto);
  }

  @Get(':idDetalle')
  findOne(
    @Param('idCompra', ParseIntPipe) idCompra: number,
    @Param('idDetalle', ParseIntPipe) idDetalle: number,
  ) {
    return this.detalleService.findOne(idCompra, idDetalle);
  }

  @Patch(':idDetalle')
  update(
    @Param('idCompra', ParseIntPipe) idCompra: number,
    @Param('idDetalle', ParseIntPipe) idDetalle: number,
    @Body() dto: UpdateCompraDetalleDto,
  ) {
    return this.detalleService.update(idCompra, idDetalle, dto);
  }

  @Delete(':idDetalle')
  remove(
    @Param('idCompra', ParseIntPipe) idCompra: number,
    @Param('idDetalle', ParseIntPipe) idDetalle: number,
  ) {
    return this.detalleService.remove(idCompra, idDetalle);
  }
}
