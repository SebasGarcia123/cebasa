import { Body, Controller, Get, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PlanificadorEntregasService } from './planificador-entregas.service.js';
import { AsignarFechaSalidaDto } from './dto/asignar-fecha-salida.dto.js';
import { ReordenarPedidosDto } from './dto/reordenar-pedidos.dto.js';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';

@ApiTags('Planificador de Entregas')
@Controller('planificador-entregas')
export class PlanificadorEntregasController {
  constructor(private readonly service: PlanificadorEntregasService) {}

  @RequirePermissions('planificador_entregas.ver')
  @Get()
  obtenerTablero() {
    return this.service.obtenerTablero();
  }

  @RequirePermissions('planificador_entregas.editar')
  @Patch('pedidos/:id/fecha-salida')
  asignarFechaSalida(@Param('id', ParseIntPipe) id: number, @Body() dto: AsignarFechaSalidaDto) {
    return this.service.asignarFechaSalida(id, dto);
  }

  @RequirePermissions('planificador_entregas.editar')
  @Patch('orden')
  reordenar(@Body() dto: ReordenarPedidosDto) {
    return this.service.reordenar(dto);
  }
}
