import { PartialType } from '@nestjs/mapped-types';
import { CreateRequerimientoDetalleDto } from './create-requerimiento-detalle.dto.js';

export class UpdateRequerimientoDetalleDto extends PartialType(
  CreateRequerimientoDetalleDto,
) {}
