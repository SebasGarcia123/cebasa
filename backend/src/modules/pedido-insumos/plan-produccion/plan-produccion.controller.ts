import { BadRequestException, Controller, Get, Query } from '@nestjs/common';
import { PlanProduccionService } from './plan-produccion.service.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';

@ApiTags('Plan Produccion')
@Controller('planes-produccion')
export class PlanProduccionController {
  constructor(private readonly planProduccionService: PlanProduccionService) {}

  // ?fecha=YYYY-MM-DD: cualquier fecha de la semana que se quiere ver
  // (no hace falta que sea un lunes, el service lo resuelve).
  @RequirePermissions('pedido_insumos.ver')
  @Get('semana')
  obtenerSemana(@Query('fecha') fecha: string) {
    if (!fecha || Number.isNaN(Date.parse(fecha))) {
      throw new BadRequestException('Falta una fecha válida (?fecha=YYYY-MM-DD)');
    }
    return this.planProduccionService.obtenerSemana(new Date(fecha));
  }
}
