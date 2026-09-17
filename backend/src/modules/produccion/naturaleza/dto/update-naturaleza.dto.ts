import { PartialType } from '@nestjs/mapped-types';
import { CreateNaturalezaDto } from './create-naturaleza.dto.js';

export class UpdateNaturalezaDto extends PartialType(CreateNaturalezaDto) {}
