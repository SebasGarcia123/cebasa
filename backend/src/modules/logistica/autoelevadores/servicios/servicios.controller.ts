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

@ApiTags('Autoelevadores - Servicios')
@Controller('autoelevadores/:idAutoelevador/servicios')
export class ServiciosAutoelevadorController {
  constructor(
    private readonly serviciosService: ServiciosAutoelevadorService,
  ) {}

  @Get()
  findAll(@Param('idAutoelevador', ParseIntPipe) idAutoelevador: number) {
    return this.serviciosService.findAllForAutoelevador(idAutoelevador);
  }

  @Post()
  create(
    @Param('idAutoelevador', ParseIntPipe) idAutoelevador: number,
    @Body() dto: CreateServicioAutoelevadorDto,
  ) {
    return this.serviciosService.create(idAutoelevador, dto);
  }

  @Get(':idServicio')
  findOne(
    @Param('idAutoelevador', ParseIntPipe) idAutoelevador: number,
    @Param('idServicio', ParseIntPipe) idServicio: number,
  ) {
    return this.serviciosService.findOne(idAutoelevador, idServicio);
  }

  @Patch(':idServicio')
  update(
    @Param('idAutoelevador', ParseIntPipe) idAutoelevador: number,
    @Param('idServicio', ParseIntPipe) idServicio: number,
    @Body() dto: UpdateServicioAutoelevadorDto,
  ) {
    return this.serviciosService.update(idAutoelevador, idServicio, dto);
  }

  @Delete(':idServicio')
  remove(
    @Param('idAutoelevador', ParseIntPipe) idAutoelevador: number,
    @Param('idServicio', ParseIntPipe) idServicio: number,
  ) {
    return this.serviciosService.remove(idAutoelevador, idServicio);
  }
}
