import { PartialType } from '@nestjs/mapped-types';
import { CreateRecetaDto } from './create-receta.dto.js';

export class UpdateRecetaDto extends PartialType(CreateRecetaDto) {}
