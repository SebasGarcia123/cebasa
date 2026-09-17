import { PartialType } from '@nestjs/mapped-types';
import { CreateTransporteDto } from './create-transporte.dto.js';

export class UpdateTransporteDto extends PartialType(CreateTransporteDto) {}
