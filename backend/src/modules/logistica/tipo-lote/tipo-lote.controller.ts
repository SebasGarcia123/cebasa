import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { TipoLoteService } from './tipo-lote.service.js';
import { CreateTipoLoteDto } from './dto/create-tipo-lote.dto.js';
import { UpdateTipoLoteDto } from './dto/update-tipo-lote.dto.js';

@Controller('tipo-lote')
export class TipoLoteController {
  constructor(private readonly tipoLoteService: TipoLoteService) {}

  @Post()
  create(@Body() dto: CreateTipoLoteDto) {
    return this.tipoLoteService.create(dto);
  }

  @Get()
  findAll() {
    return this.tipoLoteService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tipoLoteService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTipoLoteDto) {
    return this.tipoLoteService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tipoLoteService.remove(id);
  }
}
