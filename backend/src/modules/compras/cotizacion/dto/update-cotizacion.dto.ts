import { PartialType } from '@nestjs/mapped-types';
import { CreateCotizacionDto } from './create-cotizacion.dto.js';

export class UpdateCotizacionDto extends PartialType(CreateCotizacionDto) {}
