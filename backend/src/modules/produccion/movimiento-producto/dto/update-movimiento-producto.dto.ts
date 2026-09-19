import { PartialType } from '@nestjs/mapped-types';
import { CreateMovimientoProductoDto } from './create-movimiento-producto.dto.js';

export class UpdateMovimientoProductoDto extends PartialType(
  CreateMovimientoProductoDto,
) {}
