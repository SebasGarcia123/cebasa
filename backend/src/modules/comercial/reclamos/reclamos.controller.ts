import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ReclamosService } from './reclamos.service.js';
import { CreateReclamoDto } from './dto/create-reclamo.dto.js';
import { UpdateReclamoDto } from './dto/update-reclamo.dto.js';

@Controller('reclamos')
export class ReclamosController {
  constructor(private readonly reclamosService: ReclamosService) {}

  @Post()
  create(@Body() dto: CreateReclamoDto) {
    return this.reclamosService.create(dto);
  }

  @Get()
  findAll() {
    return this.reclamosService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.reclamosService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateReclamoDto) {
    return this.reclamosService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.reclamosService.remove(id);
  }
}
