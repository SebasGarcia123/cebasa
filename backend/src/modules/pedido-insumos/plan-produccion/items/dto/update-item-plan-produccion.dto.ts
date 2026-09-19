import { PartialType } from '@nestjs/mapped-types';
import { CreateItemPlanProduccionDto } from './create-item-plan-produccion.dto.js';

export class UpdateItemPlanProduccionDto extends PartialType(
  CreateItemPlanProduccionDto,
) {}
