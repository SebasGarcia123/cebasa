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
import { CotizacionDetalleService } from './cotizacion-detalle.service.js';
import { CreateCotizacionDetalleDto } from './dto/create-cotizacion-detalle.dto.js';
import { UpdateCotizacionDetalleDto } from './dto/update-cotizacion-detalle.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../../auth/decorators/permissions.decorator.js';

@ApiTags('Cotizacion - Detalle')
@Controller('cotizaciones/:idCotizacion/detalle')
export class CotizacionDetalleController {
  constructor(private readonly detalleService: CotizacionDetalleService) {}

  @RequirePermissions('compras.ver')
  @Get()
  findAll(@Param('idCotizacion', ParseIntPipe) idCotizacion: number) {
    return this.detalleService.findAllForCotizacion(idCotizacion);
  }

  @RequirePermissions('compras.editar')
  @Post()
  create(
    @Param('idCotizacion', ParseIntPipe) idCotizacion: number,
    @Body() dto: CreateCotizacionDetalleDto,
  ) {
    return this.detalleService.create(idCotizacion, dto);
  }

  @RequirePermissions('compras.ver')
  @Get(':idDetalle')
  findOne(
    @Param('idCotizacion', ParseIntPipe) idCotizacion: number,
    @Param('idDetalle', ParseIntPipe) idDetalle: number,
  ) {
    return this.detalleService.findOne(idCotizacion, idDetalle);
  }

  @RequirePermissions('compras.editar')
  @Patch(':idDetalle')
  update(
    @Param('idCotizacion', ParseIntPipe) idCotizacion: number,
    @Param('idDetalle', ParseIntPipe) idDetalle: number,
    @Body() dto: UpdateCotizacionDetalleDto,
  ) {
    return this.detalleService.update(idCotizacion, idDetalle, dto);
  }

  @RequirePermissions('compras.editar')
  @Delete(':idDetalle')
  remove(
    @Param('idCotizacion', ParseIntPipe) idCotizacion: number,
    @Param('idDetalle', ParseIntPipe) idDetalle: number,
  ) {
    return this.detalleService.remove(idCotizacion, idDetalle);
  }
}
