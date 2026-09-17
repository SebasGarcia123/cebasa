import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ArchivoAdjuntoService } from './archivo-adjunto.service.js';
import { CreateArchivoAdjuntoDto } from './dto/create-archivo-adjunto.dto.js';
import { UpdateArchivoAdjuntoDto } from './dto/update-archivo-adjunto.dto.js';

@Controller('archivos-adjuntos')
export class ArchivoAdjuntoController {
  constructor(private readonly archivoAdjuntoService: ArchivoAdjuntoService) {}

  @Post()
  create(@Body() dto: CreateArchivoAdjuntoDto) {
    return this.archivoAdjuntoService.create(dto);
  }

  @Get()
  findAll() {
    return this.archivoAdjuntoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.archivoAdjuntoService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateArchivoAdjuntoDto) {
    return this.archivoAdjuntoService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.archivoAdjuntoService.remove(id);
  }
}
