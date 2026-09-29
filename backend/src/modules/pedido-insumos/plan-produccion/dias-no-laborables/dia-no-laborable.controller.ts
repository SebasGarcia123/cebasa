import { Body, Controller, Delete, Param, ParseIntPipe, Post } from '@nestjs/common';
import { DiaNoLaborableService } from './dia-no-laborable.service.js';
import { CreateDiaNoLaborableDto } from './dto/create-dia-no-laborable.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../../auth/decorators/permissions.decorator.js';
import { CurrentUser } from '../../../../auth/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../../../auth/types/jwt-payload.interface.js';

@ApiTags('Plan Produccion - Dias No Laborables')
@Controller('planes-produccion/dias-no-laborables')
export class DiaNoLaborableController {
  constructor(private readonly diaNoLaborableService: DiaNoLaborableService) {}

  @RequirePermissions('produccion.editar')
  @Post()
  create(@Body() dto: CreateDiaNoLaborableDto, @CurrentUser() user: JwtPayload) {
    return this.diaNoLaborableService.create(dto, user.sub);
  }

  @RequirePermissions('produccion.editar')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.diaNoLaborableService.remove(id);
  }
}
