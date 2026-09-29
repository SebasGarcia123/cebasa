import { PartialType } from '@nestjs/mapped-types';
import { CreateLoteDto } from './create-lote.dto.js';

// El estado ya no se edita a mano: lo maneja el flujo
// despachar/aprobar/rechazar (ver LotesService), mismo criterio que
// UpdateLoteProdDto.
export class UpdateLoteDto extends PartialType(CreateLoteDto) {}
