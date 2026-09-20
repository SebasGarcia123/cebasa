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
import { LotesService } from './lotes.service.js';
import { CreateLoteDto } from './dto/create-lote.dto.js';
import { UpdateLoteDto } from './dto/update-lote.dto.js';
import { ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../auth/decorators/permissions.decorator.js';

@ApiTags('Lotes')
@Controller('lotes')
export class LotesController {
  constructor(private readonly lotesService: LotesService) {}

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
}
