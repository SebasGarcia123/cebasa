import { PartialType } from '@nestjs/mapped-types';
import { CreateItemLoteDto } from './create-item-lote.dto.js';

export class UpdateItemLoteDto extends PartialType(CreateItemLoteDto) {}
