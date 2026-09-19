import { PartialType } from '@nestjs/mapped-types';
import { CreateCuentaCorrienteDto } from './create-cuenta-corriente.dto.js';

export class UpdateCuentaCorrienteDto extends PartialType(
  CreateCuentaCorrienteDto,
) {}
