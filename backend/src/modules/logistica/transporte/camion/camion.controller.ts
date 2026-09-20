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
import { CamionService } from './camion.service.js';
import { CreateCamionDto } from './dto/create-camion.dto.js';
import { UpdateCamionDto } from './dto/update-camion.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../../auth/decorators/permissions.decorator.js';

@ApiTags('Transporte - Camion')
@Controller('transporte/:idTransporte/camiones')
export class CamionController {
  constructor(private readonly camionService: CamionService) {}

  @RequirePermissions('logistica.ver')
  @Get()
  findAll(@Param('idTransporte', ParseIntPipe) idTransporte: number) {
    return this.camionService.findAllForTransporte(idTransporte);
  }

  @RequirePermissions('logistica.editar')
  @Post()
  create(
    @Param('idTransporte', ParseIntPipe) idTransporte: number,
    @Body() dto: CreateCamionDto,
  ) {
    return this.camionService.create(idTransporte, dto);
  }

  @RequirePermissions('logistica.ver')
  @Get(':idCamion')
  findOne(
    @Param('idTransporte', ParseIntPipe) idTransporte: number,
    @Param('idCamion', ParseIntPipe) idCamion: number,
  ) {
    return this.camionService.findOne(idTransporte, idCamion);
  }

  @RequirePermissions('logistica.editar')
  @Patch(':idCamion')
  update(
    @Param('idTransporte', ParseIntPipe) idTransporte: number,
    @Param('idCamion', ParseIntPipe) idCamion: number,
    @Body() dto: UpdateCamionDto,
  ) {
    return this.camionService.update(idTransporte, idCamion, dto);
  }

  @RequirePermissions('logistica.editar')
  @Delete(':idCamion')
  remove(
    @Param('idTransporte', ParseIntPipe) idTransporte: number,
    @Param('idCamion', ParseIntPipe) idCamion: number,
  ) {
    return this.camionService.remove(idTransporte, idCamion);
  }
}
