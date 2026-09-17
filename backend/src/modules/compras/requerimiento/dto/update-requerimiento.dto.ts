import { PartialType } from '@nestjs/mapped-types';
import { CreateRequerimientoDto } from './create-requerimiento.dto.js';

export class UpdateRequerimientoDto extends PartialType(CreateRequerimientoDto) {}
