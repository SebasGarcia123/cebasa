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
import { ChoferService } from './chofer.service.js';
import { CreateChoferDto } from './dto/create-chofer.dto.js';
import { UpdateChoferDto } from './dto/update-chofer.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../../auth/decorators/permissions.decorator.js';

@ApiTags('Transporte - Chofer')
@Controller('transporte/:idTransporte/choferes')
export class ChoferController {
  constructor(private readonly choferService: ChoferService) {}

  @RequirePermissions('logistica.ver')
  @Get()
  findAll(@Param('idTransporte', ParseIntPipe) idTransporte: number) {
    return this.choferService.findAllForTransporte(idTransporte);
  }

  @RequirePermissions('logistica.editar')
  @Post()
  create(
    @Param('idTransporte', ParseIntPipe) idTransporte: number,
    @Body() dto: CreateChoferDto,
  ) {
    return this.choferService.create(idTransporte, dto);
  }

  @RequirePermissions('logistica.ver')
  @Get(':idChofer')
  findOne(
    @Param('idTransporte', ParseIntPipe) idTransporte: number,
    @Param('idChofer', ParseIntPipe) idChofer: number,
  ) {
    return this.choferService.findOne(idTransporte, idChofer);
  }

  @RequirePermissions('logistica.editar')
  @Patch(':idChofer')
  update(
    @Param('idTransporte', ParseIntPipe) idTransporte: number,
    @Param('idChofer', ParseIntPipe) idChofer: number,
    @Body() dto: UpdateChoferDto,
  ) {
    return this.choferService.update(idTransporte, idChofer, dto);
  }

  @RequirePermissions('logistica.editar')
  @Delete(':idChofer')
  remove(
    @Param('idTransporte', ParseIntPipe) idTransporte: number,
    @Param('idChofer', ParseIntPipe) idChofer: number,
  ) {
    return this.choferService.remove(idTransporte, idChofer);
  }
}
