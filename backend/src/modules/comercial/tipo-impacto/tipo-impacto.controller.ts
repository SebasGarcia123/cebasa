import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { TipoImpactoService } from './tipo-impacto.service.js';
import { CreateTipoImpactoDto } from './dto/create-tipo-impacto.dto.js';
import { UpdateTipoImpactoDto } from './dto/update-tipo-impacto.dto.js';

@Controller('tipo-impacto')
export class TipoImpactoController {
  constructor(private readonly tipoImpactoService: TipoImpactoService) {}

  @Post()
  create(@Body() dto: CreateTipoImpactoDto) {
    return this.tipoImpactoService.create(dto);
  }

  @Get()
  findAll() {
    return this.tipoImpactoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tipoImpactoService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTipoImpactoDto) {
    return this.tipoImpactoService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.tipoImpactoService.remove(id);
  }
}
