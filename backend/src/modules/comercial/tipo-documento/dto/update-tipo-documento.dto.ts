import { PartialType } from '@nestjs/mapped-types';
import { CreateTipoDocumentoDto } from './create-tipo-documento.dto.js';

export class UpdateTipoDocumentoDto extends PartialType(
  CreateTipoDocumentoDto,
) {}
