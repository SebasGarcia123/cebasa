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
import { TipoLoteService } from './tipo-lote.service.js';
import { CreateTipoLoteDto } from './dto/create-tipo-lote.dto.js';
import { UpdateTipoLoteDto } from './dto/update-tipo-lote.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';

@ApiTags('Tipo Lote')
@Controller('tipo-lote')
export class TipoLoteController {
  constructor(private readonly tipoLoteService: TipoLoteService) {}

  @RequirePermissions('logistica.editar')
  @Post()
  create(@Body() dto: CreateTipoLoteDto) {
    return this.tipoLoteService.create(dto);
  }

  @RequirePermissions('logistica.ver')
  @Get()
  findAll() {
    return this.tipoLoteService.findAll();
  }

  @RequirePermissions('logistica.ver')
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tipoLoteService.findOne(id);
  }

  @RequirePermissions('logistica.editar')
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTipoLoteDto,
  ) {
    return this.tipoLoteService.update(id, dto);
  }

  @RequirePermissions('logistica.editar')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tipoLoteService.remove(id);
  }
}
