import { PartialType } from '@nestjs/mapped-types';
import { CreateDepositoDto } from './create-deposito.dto.js';

export class UpdateDepositoDto extends PartialType(CreateDepositoDto) {}
