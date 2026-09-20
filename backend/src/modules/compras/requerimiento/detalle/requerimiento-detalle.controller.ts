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
import { RequerimientoDetalleService } from './requerimiento-detalle.service.js';
import { CreateRequerimientoDetalleDto } from './dto/create-requerimiento-detalle.dto.js';
import { UpdateRequerimientoDetalleDto } from './dto/update-requerimiento-detalle.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../../auth/decorators/permissions.decorator.js';

@ApiTags('Requerimiento - Detalle')
@Controller('requerimientos/:idRequerimiento/detalle')
export class RequerimientoDetalleController {
  constructor(private readonly detalleService: RequerimientoDetalleService) {}

  @RequirePermissions('compras.ver')
  @Get()
  findAll(@Param('idRequerimiento', ParseIntPipe) idRequerimiento: number) {
    return this.detalleService.findAllForRequerimiento(idRequerimiento);
  }

  @RequirePermissions('compras.editar')
  @Post()
  create(
    @Param('idRequerimiento', ParseIntPipe) idRequerimiento: number,
    @Body() dto: CreateRequerimientoDetalleDto,
  ) {
    return this.detalleService.create(idRequerimiento, dto);
  }

  @RequirePermissions('compras.ver')
  @Get(':idDetalle')
  findOne(
    @Param('idRequerimiento', ParseIntPipe) idRequerimiento: number,
    @Param('idDetalle', ParseIntPipe) idDetalle: number,
  ) {
    return this.detalleService.findOne(idRequerimiento, idDetalle);
  }

  @RequirePermissions('compras.editar')
  @Patch(':idDetalle')
  update(
    @Param('idRequerimiento', ParseIntPipe) idRequerimiento: number,
    @Param('idDetalle', ParseIntPipe) idDetalle: number,
    @Body() dto: UpdateRequerimientoDetalleDto,
  ) {
    return this.detalleService.update(idRequerimiento, idDetalle, dto);
  }

  @RequirePermissions('compras.editar')
  @Delete(':idDetalle')
  remove(
    @Param('idRequerimiento', ParseIntPipe) idRequerimiento: number,
    @Param('idDetalle', ParseIntPipe) idDetalle: number,
  ) {
    return this.detalleService.remove(idRequerimiento, idDetalle);
  }
}
