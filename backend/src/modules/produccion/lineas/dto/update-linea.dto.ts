import { PartialType } from '@nestjs/mapped-types';
import { CreateLineaDto } from './create-linea.dto.js';

export class UpdateLineaDto extends PartialType(CreateLineaDto) {}
