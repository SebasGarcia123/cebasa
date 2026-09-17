import { PartialType } from '@nestjs/mapped-types';
import { CreateServicioAutoelevadorDto } from './create-servicio.dto.js';

export class UpdateServicioAutoelevadorDto extends PartialType(CreateServicioAutoelevadorDto) {}
