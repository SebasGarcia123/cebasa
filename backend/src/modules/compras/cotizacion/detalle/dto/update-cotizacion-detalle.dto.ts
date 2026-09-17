import { PartialType } from '@nestjs/mapped-types';
import { CreateCotizacionDetalleDto } from './create-cotizacion-detalle.dto.js';

export class UpdateCotizacionDetalleDto extends PartialType(CreateCotizacionDetalleDto) {}
