import { PartialType } from '@nestjs/mapped-types';
import { CreatePermisoDto } from './create-permiso.dto.js';

export class UpdatePermisoDto extends PartialType(CreatePermisoDto) {}
