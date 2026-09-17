import { PartialType } from '@nestjs/mapped-types';
import { CreateTipoImpactoDto } from './create-tipo-impacto.dto.js';

export class UpdateTipoImpactoDto extends PartialType(CreateTipoImpactoDto) {}
