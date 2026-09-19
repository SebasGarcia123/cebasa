import { PartialType } from '@nestjs/mapped-types';
import { CreateMovimientoInsumoDto } from './create-movimiento-insumo.dto.js';

export class UpdateMovimientoInsumoDto extends PartialType(
  CreateMovimientoInsumoDto,
) {}
