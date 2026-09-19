import { PartialType } from '@nestjs/mapped-types';
import { CreateControlAutoelevadorDto } from './create-control.dto.js';

export class UpdateControlAutoelevadorDto extends PartialType(
  CreateControlAutoelevadorDto,
) {}
