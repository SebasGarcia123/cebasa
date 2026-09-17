import { PartialType } from '@nestjs/mapped-types';
import { CreateAutoelevadorDto } from './create-autoelevador.dto.js';

export class UpdateAutoelevadorDto extends PartialType(CreateAutoelevadorDto) {}
