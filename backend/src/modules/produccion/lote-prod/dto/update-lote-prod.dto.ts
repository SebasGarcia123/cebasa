import { PartialType } from '@nestjs/mapped-types';
import { CreateLoteProdDto } from './create-lote-prod.dto.js';

export class UpdateLoteProdDto extends PartialType(CreateLoteProdDto) {}
