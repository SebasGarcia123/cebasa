import { PartialType } from '@nestjs/mapped-types';
import { CreateItemProdDto } from './create-item-prod.dto.js';

export class UpdateItemProdDto extends PartialType(CreateItemProdDto) {}
