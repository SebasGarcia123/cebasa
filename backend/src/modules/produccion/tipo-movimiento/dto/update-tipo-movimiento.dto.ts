import { PartialType } from '@nestjs/mapped-types';
import { CreateTipoMovimientoDto } from './create-tipo-movimiento.dto.js';

export class UpdateTipoMovimientoDto extends PartialType(
  CreateTipoMovimientoDto,
) {}
