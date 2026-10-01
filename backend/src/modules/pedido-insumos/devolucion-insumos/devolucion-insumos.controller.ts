import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DevolucionInsumosService } from './devolucion-insumos.service.js';
import { CreateDevolucionInsumosDto } from './dto/create-devolucion-insumos.dto.js';
import { UpdateDevolucionInsumosDto } from './dto/update-devolucion-insumos.dto.js';
import { RechazarDevolucionInsumosDto } from './dto/rechazar-devolucion-insumos.dto.js';
import { AprobarDevolucionInsumosDto } from './dto/aprobar-devolucion-insumos.dto.js';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../../auth/types/jwt-payload.interface.js';

@ApiTags('Devolucion Insumos')
@Controller('devoluciones-insumos')
export class DevolucionInsumosController {
  constructor(private readonly devolucionInsumosService: DevolucionInsumosService) {}

  // Lo carga el operario o el jefe de Producción.
  @RequirePermissions('produccion.devolucion_insumos.solicitar')
  @Post()
  create(@Body() dto: CreateDevolucionInsumosDto, @CurrentUser() user: JwtPayload) {
    return this.devolucionInsumosService.create(dto, user.sub);
  }

  // Pantalla de Producción: todas sus devoluciones, con filtro de fecha
  // y "ver todos" (si no, oculta las Aprobadas).
  @RequirePermissions('produccion.devolucion_insumos.ver')
  @Get()
  findParaProduccion(
    @CurrentUser() user: JwtPayload,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('verTodos') verTodos?: string,
  ) {
    return this.devolucionInsumosService.findParaProduccion(user, { desde, hasta, verTodos: verTodos === 'true' });
  }

  // Pantalla del jefe de Logística: misma vista, con los mismos filtros.
  @RequirePermissions('logistica.devolucion_insumos.ver')
  @Get('para-logistica')
  findParaLogistica(
    @CurrentUser() user: JwtPayload,
    @Query('desde') desde?: string,
    @Query('hasta') hasta?: string,
    @Query('verTodos') verTodos?: string,
  ) {
    return this.devolucionInsumosService.findParaLogistica(user, { desde, hasta, verTodos: verTodos === 'true' });
  }

  // Lo consultan ambas audiencias, cada una ya filtrada por los
  // endpoints de arriba; sin permiso propio, igual que pedidos-insumos/:id.
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.devolucionInsumosService.findOne(id);
  }

  // Corrige una devolución Pendiente o Rechazada (reemplaza los ítems).
  @RequirePermissions('produccion.devolucion_insumos.solicitar')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateDevolucionInsumosDto) {
    return this.devolucionInsumosService.update(id, dto);
  }

  // El jefe de Logística aprueba: mueve el stock de Producción a
  // Logística de esa misma planta.
  @RequirePermissions('logistica.devolucion_insumos.aprobar')
  @Post(':id/aprobar')
  aprobar(@Param('id', ParseIntPipe) id: number, @Body() dto: AprobarDevolucionInsumosDto, @CurrentUser() user: JwtPayload) {
    return this.devolucionInsumosService.aprobar(id, dto, user);
  }

  // El jefe de Logística rechaza con un motivo: vuelve a quedar
  // accionable para Producción, que la corrige.
  @RequirePermissions('logistica.devolucion_insumos.aprobar')
  @Post(':id/rechazar')
  rechazar(@Param('id', ParseIntPipe) id: number, @Body() dto: RechazarDevolucionInsumosDto, @CurrentUser() user: JwtPayload) {
    return this.devolucionInsumosService.rechazar(id, dto, user);
  }
}
