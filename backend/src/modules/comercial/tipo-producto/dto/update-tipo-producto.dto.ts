import { PartialType } from '@nestjs/mapped-types';
import { CreateTipoProductoDto } from './create-tipo-producto.dto.js';

export class UpdateTipoProductoDto extends PartialType(CreateTipoProductoDto) {}
