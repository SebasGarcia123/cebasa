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
import { CotizacionService } from './cotizacion.service.js';
import { CreateCotizacionDto } from './dto/create-cotizacion.dto.js';
import { UpdateCotizacionDto } from './dto/update-cotizacion.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';

@ApiTags('Cotizacion')
@Controller('cotizaciones')
export class CotizacionController {
  constructor(private readonly cotizacionService: CotizacionService) {}

  @RequirePermissions('compras.editar')
  @Post()
  create(@Body() dto: CreateCotizacionDto) {
    return this.cotizacionService.create(dto);
  }

  @RequirePermissions('compras.ver')
  @Get()
  findAll() {
    return this.cotizacionService.findAll();
  }

  @RequirePermissions('compras.ver')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.cotizacionService.findOne(id);
  }

  @RequirePermissions('compras.editar')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCotizacionDto,
  ) {
    return this.cotizacionService.update(id, dto);
  }

  @RequirePermissions('compras.editar')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.cotizacionService.remove(id);
  }
}
