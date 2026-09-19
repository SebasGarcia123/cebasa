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

@ApiTags('Transporte - Camion')
@Controller('transporte/:idTransporte/camiones')
export class CamionController {
  constructor(private readonly camionService: CamionService) {}

  @Get()
  findAll(@Param('idTransporte', ParseIntPipe) idTransporte: number) {
    return this.camionService.findAllForTransporte(idTransporte);
  }

  @Post()
  create(
    @Param('idTransporte', ParseIntPipe) idTransporte: number,
    @Body() dto: CreateCamionDto,
  ) {
    return this.camionService.create(idTransporte, dto);
  }

  @Get(':idCamion')
  findOne(
    @Param('idTransporte', ParseIntPipe) idTransporte: number,
    @Param('idCamion', ParseIntPipe) idCamion: number,
  ) {
    return this.camionService.findOne(idTransporte, idCamion);
  }

  @Patch(':idCamion')
  update(
    @Param('idTransporte', ParseIntPipe) idTransporte: number,
    @Param('idCamion', ParseIntPipe) idCamion: number,
    @Body() dto: UpdateCamionDto,
  ) {
    return this.camionService.update(idTransporte, idCamion, dto);
  }

  @Delete(':idCamion')
  remove(
    @Param('idTransporte', ParseIntPipe) idTransporte: number,
    @Param('idCamion', ParseIntPipe) idCamion: number,
  ) {
    return this.camionService.remove(idTransporte, idCamion);
  }
}
