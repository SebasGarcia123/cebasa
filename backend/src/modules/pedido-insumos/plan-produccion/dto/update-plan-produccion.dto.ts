import { PartialType } from '@nestjs/mapped-types';
import { CreatePlanProduccionDto } from './create-plan-produccion.dto.js';

export class UpdatePlanProduccionDto extends PartialType(
  CreatePlanProduccionDto,
) {}
