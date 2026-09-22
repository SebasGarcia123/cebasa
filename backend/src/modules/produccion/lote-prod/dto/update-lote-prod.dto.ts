import { PartialType } from '@nestjs/mapped-types';
import { CreateLoteProdDto } from './create-lote-prod.dto.js';

// id_estado no se recibe nunca por acá: el estado del lote lo maneja
// por completo el flujo de aprobación (ver LoteProdService). El alta
// arranca "Pendiente de aprobación"; de ahí en más solo cambia vía
// aprobar()/rechazar(), o automáticamente a "Pendiente de aprobación"
// de nuevo cuando Producción reedita un lote "Rechazado".
export class UpdateLoteProdDto extends PartialType(CreateLoteProdDto) {}
