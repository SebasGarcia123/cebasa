import { PartialType } from '@nestjs/mapped-types';
import { CreateChoferDto } from './create-chofer.dto.js';

export class UpdateChoferDto extends PartialType(CreateChoferDto) {}
