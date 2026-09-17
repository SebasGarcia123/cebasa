import { PartialType } from '@nestjs/mapped-types';
import { CreateTurnoDto } from './create-turno.dto.js';

export class UpdateTurnoDto extends PartialType(CreateTurnoDto) {}
