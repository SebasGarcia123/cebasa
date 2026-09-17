import { PartialType } from '@nestjs/mapped-types';
import { CreateRecetaItemDto } from './create-receta-item.dto.js';

export class UpdateRecetaItemDto extends PartialType(CreateRecetaItemDto) {}
