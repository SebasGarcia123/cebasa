import { PartialType } from '@nestjs/mapped-types';
import { CreateTipoBobinaDto } from './create-tipo-bobina.dto.js';

export class UpdateTipoBobinaDto extends PartialType(CreateTipoBobinaDto) {}
