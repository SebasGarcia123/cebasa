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
import { CompraDetalleService } from './compra-detalle.service.js';
import { CreateCompraDetalleDto } from './dto/create-compra-detalle.dto.js';
import { UpdateCompraDetalleDto } from './dto/update-compra-detalle.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../../auth/decorators/permissions.decorator.js';

@ApiTags('Compra - Detalle')
@Controller('compras/:idCompra/detalle')
export class CompraDetalleController {
  constructor(private readonly detalleService: CompraDetalleService) {}

  @RequirePermissions('compras.ver')
  @Get()
  findAll(@Param('idCompra', ParseIntPipe) idCompra: number) {
    return this.detalleService.findAllForCompra(idCompra);
  }

  @RequirePermissions('compras.editar')
  @Post()
  create(
    @Param('idCompra', ParseIntPipe) idCompra: number,
    @Body() dto: CreateCompraDetalleDto,
  ) {
    return this.detalleService.create(idCompra, dto);
  }

  @RequirePermissions('compras.ver')
  @Get(':idDetalle')
  findOne(
    @Param('idCompra', ParseIntPipe) idCompra: number,
    @Param('idDetalle', ParseIntPipe) idDetalle: number,
  ) {
    return this.detalleService.findOne(idCompra, idDetalle);
  }

  @RequirePermissions('compras.editar')
  @Patch(':idDetalle')
  update(
    @Param('idCompra', ParseIntPipe) idCompra: number,
    @Param('idDetalle', ParseIntPipe) idDetalle: number,
    @Body() dto: UpdateCompraDetalleDto,
  ) {
    return this.detalleService.update(idCompra, idDetalle, dto);
  }

  @RequirePermissions('compras.editar')
  @Delete(':idDetalle')
  remove(
    @Param('idCompra', ParseIntPipe) idCompra: number,
    @Param('idDetalle', ParseIntPipe) idDetalle: number,
  ) {
    return this.detalleService.remove(idCompra, idDetalle);
  }
}
