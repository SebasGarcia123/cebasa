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
import { ServiciosAutoelevadorService } from './servicios.service.js';
import { CreateServicioAutoelevadorDto } from './dto/create-servicio.dto.js';
import { UpdateServicioAutoelevadorDto } from './dto/update-servicio.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../../auth/decorators/permissions.decorator.js';

@ApiTags('Autoelevadores - Servicios')
@Controller('autoelevadores/:idAutoelevador/servicios')
export class ServiciosAutoelevadorController {
  constructor(
    private readonly serviciosService: ServiciosAutoelevadorService,
  ) {}

  @RequirePermissions('logistica.ver')
  @Get()
  findAll(@Param('idAutoelevador', ParseIntPipe) idAutoelevador: number) {
    return this.serviciosService.findAllForAutoelevador(idAutoelevador);
  }

  @RequirePermissions('logistica.editar')
  @Post()
  create(
    @Param('idAutoelevador', ParseIntPipe) idAutoelevador: number,
    @Body() dto: CreateServicioAutoelevadorDto,
  ) {
    return this.serviciosService.create(idAutoelevador, dto);
  }

  @RequirePermissions('logistica.ver')
  @Get(':idServicio')
  findOne(
    @Param('idAutoelevador', ParseIntPipe) idAutoelevador: number,
    @Param('idServicio', ParseIntPipe) idServicio: number,
  ) {
    return this.serviciosService.findOne(idAutoelevador, idServicio);
  }

  @RequirePermissions('logistica.editar')
  @Patch(':idServicio')
  update(
    @Param('idAutoelevador', ParseIntPipe) idAutoelevador: number,
    @Param('idServicio', ParseIntPipe) idServicio: number,
    @Body() dto: UpdateServicioAutoelevadorDto,
  ) {
    return this.serviciosService.update(idAutoelevador, idServicio, dto);
  }

  @RequirePermissions('logistica.editar')
  @Delete(':idServicio')
  remove(
    @Param('idAutoelevador', ParseIntPipe) idAutoelevador: number,
    @Param('idServicio', ParseIntPipe) idServicio: number,
  ) {
    return this.serviciosService.remove(idAutoelevador, idServicio);
  }
}
