import { PartialType } from '@nestjs/mapped-types';
import { CreateTipoLoteDto } from './create-tipo-lote.dto.js';

export class UpdateTipoLoteDto extends PartialType(CreateTipoLoteDto) {}
