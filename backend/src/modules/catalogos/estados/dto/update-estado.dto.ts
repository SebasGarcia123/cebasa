import { PartialType } from '@nestjs/mapped-types';
import { CreateEstadoDto } from './create-estado.dto.js';

export class UpdateEstadoDto extends PartialType(CreateEstadoDto) {}
