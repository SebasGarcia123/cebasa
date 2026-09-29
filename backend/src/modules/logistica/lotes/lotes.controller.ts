import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { LotesService } from './lotes.service.js';
import { LoteInterplantaPdfService } from './lote-interplanta-pdf.service.js';
import { CreateLoteDto } from './dto/create-lote.dto.js';
import { UpdateLoteDto } from './dto/update-lote.dto.js';
import { RechazarLoteDto } from './dto/rechazar-lote.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../../auth/types/jwt-payload.interface.js';

@ApiTags('Lotes')
@Controller('lotes')
export class LotesController {
  constructor(
    private readonly lotesService: LotesService,
    private readonly pdfService: LoteInterplantaPdfService,
  ) {}

  @RequirePermissions('logistica.editar')
  @Post()
  create(@Body() dto: CreateLoteDto) {
    return this.lotesService.create(dto);
  }

  @RequirePermissions('logistica.ver')
  @Get()
  findAll() {
    return this.lotesService.findAll();
  }

  @RequirePermissions('logistica.ver')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.lotesService.findOne(id);
  }

  @RequirePermissions('logistica.editar')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateLoteDto) {
    return this.lotesService.update(id, dto);
  }

  @RequirePermissions('logistica.editar')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.lotesService.remove(id);
  }

  @RequirePermissions('logistica.editar')
  @Post(':id/despachar')
  despachar(@Param('id', ParseIntPipe) id: number) {
    return this.lotesService.despachar(id);
  }

  // Aprobar/rechazar es tarea del Jefe de Logística de la planta
  // destino, no de quien carga el lote: permiso propio en vez de
  // logistica.editar (mismo criterio que produccion.lotes_aprobar).
  @RequirePermissions('logistica.lotes_aprobar')
  @Post(':id/aprobar')
  aprobar(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: JwtPayload) {
    return this.lotesService.aprobar(id, user);
  }

  @RequirePermissions('logistica.lotes_aprobar')
  @Post(':id/rechazar')
  rechazar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RechazarLoteDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.lotesService.rechazar(id, dto, user);
  }

  @RequirePermissions('logistica.ver')
  @Get(':id/pdf')
  async pdf(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
    const lote = await this.lotesService.findOne(id);
    const pdf = await this.pdfService.generar({
      ...lote,
      item_lote: lote.item_lote.map((item) => ({ ...item, cantidad: Number(item.cantidad) })),
    });
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="lote-${id}.pdf"`,
    });
    res.send(pdf);
  }
}
