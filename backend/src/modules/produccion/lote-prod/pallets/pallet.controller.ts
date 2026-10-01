import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags } from '@nestjs/swagger';
import { PalletService } from './pallet.service.js';
import { CreatePalletDto } from './dto/create-pallet.dto.js';
import { RequirePermissions } from '../../../../auth/decorators/permissions.decorator.js';
import { CurrentUser } from '../../../../auth/decorators/current-user.decorator.js';
import type { JwtPayload } from '../../../../auth/types/jwt-payload.interface.js';

@ApiTags('Lote Prod - Pallets')
@Controller('lotes-prod/:idLote/pallets')
export class PalletController {
  constructor(private readonly palletService: PalletService) {}

  @RequirePermissions('produccion.lotes_prod.ver')
  @Get()
  findAll(@Param('idLote', ParseIntPipe) idLote: number) {
    return this.palletService.findAllForLote(idLote);
  }

  @RequirePermissions('produccion.operario_prod.cargar')
  @Post()
  create(
    @Param('idLote', ParseIntPipe) idLote: number,
    @Body() dto: CreatePalletDto,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.palletService.create(idLote, dto, user.sub);
  }

  @RequirePermissions('produccion.operario_prod.cargar')
  @Delete(':idPallet')
  remove(@Param('idLote', ParseIntPipe) idLote: number, @Param('idPallet', ParseIntPipe) idPallet: number) {
    return this.palletService.remove(idLote, idPallet);
  }

  @RequirePermissions('produccion.lotes_prod.ver')
  @Get(':idPallet/rotulo')
  async rotulo(
    @Param('idLote', ParseIntPipe) idLote: number,
    @Param('idPallet', ParseIntPipe) idPallet: number,
    @Res() res: Response,
  ) {
    const pdf = await this.palletService.generarRotulo(idLote, idPallet);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="pallet-${idPallet}.pdf"`,
    });
    res.send(pdf);
  }
}
