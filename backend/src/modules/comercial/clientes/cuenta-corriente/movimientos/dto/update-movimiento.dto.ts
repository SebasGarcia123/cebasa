import { PartialType } from '@nestjs/mapped-types';
import { CreateMovimientoCuentaCorrienteDto } from './create-movimiento.dto.js';

export class UpdateMovimientoCuentaCorrienteDto extends PartialType(
  CreateMovimientoCuentaCorrienteDto,
) {}
