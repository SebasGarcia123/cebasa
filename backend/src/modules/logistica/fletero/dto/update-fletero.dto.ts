import { PartialType } from '@nestjs/mapped-types';
import { CreateFleteroDto } from './create-fletero.dto.js';

export class UpdateFleteroDto extends PartialType(CreateFleteroDto) {}
