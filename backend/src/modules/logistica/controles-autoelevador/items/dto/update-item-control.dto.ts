import { PartialType } from '@nestjs/mapped-types';
import { CreateItemControlDto } from './create-item-control.dto.js';

export class UpdateItemControlDto extends PartialType(CreateItemControlDto) {}
