import { PartialType } from '@nestjs/mapped-types';
import { CreateInsumoDto } from './create-insumo.dto.js';

export class UpdateInsumoDto extends PartialType(CreateInsumoDto) {}
