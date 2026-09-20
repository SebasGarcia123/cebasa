import { Body, Controller, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ReclamosService } from './reclamos.service.js';
import { CreateReclamoDto } from './dto/create-reclamo.dto.js';
import { ResolverReclamoDto } from './dto/resolver-reclamo.dto.js';
import { RechazarReclamoDto } from './dto/rechazar-reclamo.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';

@ApiTags('Reclamos')
@Controller('reclamos')
export class ReclamosController {
  constructor(private readonly reclamosService: ReclamosService) {}

  @RequirePermissions('comercial.editar')
  @Post()
  create(@Body() dto: CreateReclamoDto) {
    return this.reclamosService.create(dto);
  }

  @RequirePermissions('comercial.ver')
  @Get()
  findAll() {
    return this.reclamosService.findAll();
  }

  @RequirePermissions('comercial.ver')
  @Get('pendientes/count')
  async countPendientes() {
    return { count: await this.reclamosService.countPendientes() };
  }

  @RequirePermissions('comercial.ver')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reclamosService.findOne(id);
  }

  // Un reclamo no se edita ni se elimina: solo se resuelve o se rechaza.
  @RequirePermissions('comercial.reclamos_resolver')
  @Post(':id/resolver')
  resolver(@Param('id', ParseIntPipe) id: number, @Body() dto: ResolverReclamoDto) {
    return this.reclamosService.resolver(id, dto);
  }

  @RequirePermissions('comercial.reclamos_resolver')
  @Post(':id/rechazar')
  rechazar(@Param('id', ParseIntPipe) id: number, @Body() dto: RechazarReclamoDto) {
    return this.reclamosService.rechazar(id, dto);
  }
}
