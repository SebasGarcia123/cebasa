import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { BobinaService } from './bobina.service.js';
import { CreateBobinaDto } from './dto/create-bobina.dto.js';
import { RequirePermissions } from '../../../../auth/decorators/permissions.decorator.js';
import { CurrentUser } from '../../../../auth/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../../../auth/types/jwt-payload.interface.js';

@ApiTags('Lote Prod - Bobinas')
@Controller('lotes-prod/:idLote/bobinas')
export class BobinaController {
  constructor(private readonly bobinaService: BobinaService) {}

  @RequirePermissions('produccion.lotes_prod.ver')
  @Get()
  findAll(@Param('idLote', ParseIntPipe) idLote: number) {
    return this.bobinaService.findAllForLote(idLote);
  }

  @RequirePermissions('produccion.operario_prod.cargar')
  @Post()
  create(
    @Param('idLote', ParseIntPipe) idLote: number,
    @Body() dto: CreateBobinaDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.bobinaService.create(idLote, dto, user.sub);
  }

  @RequirePermissions('produccion.operario_prod.cargar')
  @Delete(':idBobina')
  remove(@Param('idLote', ParseIntPipe) idLote: number, @Param('idBobina', ParseIntPipe) idBobina: number) {
    return this.bobinaService.remove(idLote, idBobina);
  }

  @RequirePermissions('produccion.lotes_prod.ver')
  @Get(':idBobina/rotulo')
  async rotulo(
    @Param('idLote', ParseIntPipe) idLote: number,
    @Param('idBobina', ParseIntPipe) idBobina: number,
    @Res() res: Response,
  ) {
    const pdf = await this.bobinaService.generarRotulo(idLote, idBobina);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="bobina-${idBobina}.pdf"`,
    });
    res.send(pdf);
  }
}
