import { PartialType } from '@nestjs/mapped-types';
import { CreateCamionDto } from './create-camion.dto.js';

export class UpdateCamionDto extends PartialType(CreateCamionDto) {}
