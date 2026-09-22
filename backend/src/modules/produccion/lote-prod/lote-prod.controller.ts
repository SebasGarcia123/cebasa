import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { LoteProdService } from './lote-prod.service.js';
import { CreateLoteProdDto } from './dto/create-lote-prod.dto.js';
import { UpdateLoteProdDto } from './dto/update-lote-prod.dto.js';
import { RechazarLoteProdDto } from './dto/rechazar-lote-prod.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';

@ApiTags('Lote Prod')
@Controller('lotes-prod')
export class LoteProdController {
  constructor(private readonly loteProdService: LoteProdService) {}

  @RequirePermissions('produccion.editar')
  @Post()
  create(@Body() dto: CreateLoteProdDto) {
    return this.loteProdService.create(dto);
  }

  @RequirePermissions('produccion.ver')
  @Get()
  findAll() {
    return this.loteProdService.findAll();
  }

  @RequirePermissions('produccion.ver')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.loteProdService.findOne(id);
  }

  @RequirePermissions('produccion.editar')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateLoteProdDto,
  ) {
    return this.loteProdService.update(id, dto);
  }

  @RequirePermissions('produccion.editar')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.loteProdService.remove(id);
  }

  // Aprobar/rechazar es tarea de Logística, no de quien carga el lote:
  // permiso propio en vez de reusar produccion.editar.
  @RequirePermissions('produccion.lotes_aprobar')
  @Post(':id/aprobar')
  aprobar(@Param('id', ParseIntPipe) id: number) {
    return this.loteProdService.aprobar(id);
  }

  @RequirePermissions('produccion.lotes_aprobar')
  @Post(':id/rechazar')
  rechazar(@Param('id', ParseIntPipe) id: number, @Body() dto: RechazarLoteProdDto) {
    return this.loteProdService.rechazar(id, dto);
  }
}
