import { PartialType } from '@nestjs/mapped-types';
import { CreateArchivoAdjuntoDto } from './create-archivo-adjunto.dto.js';

export class UpdateArchivoAdjuntoDto extends PartialType(CreateArchivoAdjuntoDto) {}
