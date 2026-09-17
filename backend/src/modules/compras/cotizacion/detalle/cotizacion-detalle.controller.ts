import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { CotizacionDetalleService } from './cotizacion-detalle.service.js';
import { CreateCotizacionDetalleDto } from './dto/create-cotizacion-detalle.dto.js';
import { UpdateCotizacionDetalleDto } from './dto/update-cotizacion-detalle.dto.js';

@Controller('cotizaciones/:idCotizacion/detalle')
export class CotizacionDetalleController {
  constructor(private readonly detalleService: CotizacionDetalleService) {}

  @Get()
  findAll(@Param('idCotizacion', ParseIntPipe) idCotizacion: number) {
    return this.detalleService.findAllForCotizacion(idCotizacion);
  }

  @Post()
  create(
    @Param('idCotizacion', ParseIntPipe) idCotizacion: number,
    @Body() dto: CreateCotizacionDetalleDto,
  ) {
    return this.detalleService.create(idCotizacion, dto);
  }

  @Get(':idDetalle')
  findOne(
    @Param('idCotizacion', ParseIntPipe) idCotizacion: number,
    @Param('idDetalle', ParseIntPipe) idDetalle: number,
  ) {
    return this.detalleService.findOne(idCotizacion, idDetalle);
  }

  @Patch(':idDetalle')
  update(
    @Param('idCotizacion', ParseIntPipe) idCotizacion: number,
    @Param('idDetalle', ParseIntPipe) idDetalle: number,
    @Body() dto: UpdateCotizacionDetalleDto,
  ) {
    return this.detalleService.update(idCotizacion, idDetalle, dto);
  }

  @Delete(':idDetalle')
  remove(
    @Param('idCotizacion', ParseIntPipe) idCotizacion: number,
    @Param('idDetalle', ParseIntPipe) idDetalle: number,
  ) {
    return this.detalleService.remove(idCotizacion, idDetalle);
  }
}
